# Meter Daemon Implementation Plan

## Goal

A Python daemon that listens for SCM+ (Standard Consumption Message Plus) radio broadcasts
from an Itron smart meter via an RTL-SDR dongle. Decoded messages are printed as JSON to
stdout (REST API integration added later).

The implementation is a direct port of the signal processing pipeline in `rtlamr-go`, using
`numpy` for performance-sensitive array operations and `pyrtlsdr` for hardware access.

## Design decisions

| Concern | Decision |
|---|---|
| SDR connection | Direct USB via `pyrtlsdr` (no `rtl_tcp`) |
| Output | JSON lines to stdout |
| Meter filtering | None — decode all SCM+ messages (meter ID discovered on first run) |
| Target platforms | macOS (development) + Raspberry Pi ARM (production) |

Because development happens on a Mac without the dongle, `src/sdr.py` should support
reading raw IQ bytes from a file (via `--sample-file` flag) as a hardware stand-in.

---

## SCM+ Protocol Reference

All values sourced from `rtlamr-go/scmplus/scmplus.go` and `rtlamr-go/protocol/decode.go`.

| Parameter        | Value                      |
|------------------|----------------------------|
| Center frequency | 912,600,155 Hz             |
| Data rate        | 32,768 bps                 |
| Chip length      | 72 samples (default)       |
| Symbol length    | 144 samples (chip × 2)     |
| Sample rate      | 2,359,296 Hz (data × chip) |
| Preamble symbols | 16                         |
| Packet symbols   | 128 (16 × 8)               |
| Preamble bits    | `0001011010100011`         |
| CRC algorithm    | CCITT-16                   |
| CRC init         | 0xFFFF                     |
| CRC poly         | 0x1021                     |
| CRC residue      | 0x1D0F                     |
| Packet size      | 16 bytes                   |

### Derived buffer sizes (chip=72)

| Name           | Formula                          | Value  |
|----------------|----------------------------------|--------|
| PreambleLength | PreambleSymbols × SymbolLength   | 2,304  |
| PacketLength   | PacketSymbols × SymbolLength     | 18,432 |
| BlockSize      | NextPowerOf2(PreambleLength)     | 4,096  |
| BlockSize2     | BlockSize × 2                    | 8,192  |
| BufferLength   | PacketLength + BlockSize         | 22,528 |

Each block read from the SDR is `BlockSize2` **samples** = `BlockSize2 × 2` bytes
(each sample is a uint8 I/Q pair).

### SCM+ packet layout (16 bytes, big-endian)

| Field        | Type   | Bytes | Validation         |
|--------------|--------|-------|--------------------|
| FrameSync    | uint16 | 0–1   |                    |
| ProtocolID   | uint8  | 2     | must equal 0x1E    |
| EndpointType | uint8  | 3     |                    |
| EndpointID   | uint32 | 4–7   | must be non-zero   |
| Consumption  | uint32 | 8–11  |                    |
| Tamper       | uint16 | 12–13 |                    |
| PacketCRC    | uint16 | 14–15 |                    |

CRC covers `bytes[2:]` (14 bytes); valid when `CCITT16(bytes[2:]) == 0x1D0F`.

---

## Module Structure

```
rtlamr-python/
├── main.py                 # CLI entry point
├── src/
│   ├── __init__.py
│   ├── sdr.py              # RTL-SDR hardware interface (pyrtlsdr)
│   ├── decoder.py          # Signal processing pipeline
│   ├── crc.py              # CCITT-16 CRC table + checksum
│   └── protocols/
│       ├── __init__.py
│       └── scmplus.py      # SCM+ packet parser + dataclass
└── plans/
    └── meter-daemon.md
```

---

## Implementation Steps

### Step 1 — `src/crc.py`

Port `rtlamr-go/crc/crc.go`.

- Build a 256-entry lookup table from polynomial `0x1021`
- `checksum(data: bytes, init: int = 0xFFFF) -> int`
- Validate: `checksum(packet_bytes[2:]) == 0x1D0F`

No dependencies.

### Step 2 — `src/protocols/scmplus.py`

- `SCMPlus` dataclass with fields matching the 16-byte packet layout
- `parse(raw_bytes: bytes) -> SCMPlus | None`
  1. Unpack 16 bytes as big-endian struct `>HBBIIIH`
  2. Run CRC check on `raw_bytes[2:]`
  3. Validate `ProtocolID == 0x1E` and `EndpointID != 0`
  4. Return populated dataclass or `None` on failure

### Step 3 — `src/decoder.py`

Port `rtlamr-go/protocol/decode.go`. All array work uses `numpy`.

**Config dataclass** holds the derived buffer sizes for a given chip length.

**`magnitude(block: np.ndarray) -> np.ndarray`**
- Input: uint8 IQ array, shape `(N,)`
- Reshape to `(N//2, 2)`, cast to float64
- Apply MagLUT: `((127.5 - samples) / 127.5) ** 2`, then sum pairs
- This is the direct port of `MagLUT.Execute`

**`matched_filter(signal: np.ndarray, chip_length: int) -> np.ndarray`**
- Cumulative sum of signal (length N+1 with leading zero)
- `lower = csum[chip_length:]`, `upper = csum[symbol_length:]`
- For each index: `f = (lower[i] - csum[i]) - (upper[i] - lower[i])`
- Quantize: `1` if `f >= 0`, else `0` (uint8)
- Port of `Decoder.Filter`

**`search_preamble(quantized: np.ndarray, preamble: np.ndarray, cfg: Config) -> list[int]`**
- Pack quantized bytes into packed bits (8 per byte via `np.packbits`)
- Two-pass elimination matching Go's `Search`:
  1. Coarse pass: eliminate byte positions where preamble bit cannot start
  2. Fine pass: verify exact preamble match at bit-level indices
- Returns list of sample indices

**`slice_packets(quantized: np.ndarray, indices: list[int], cfg: Config) -> list[bytes]`**
- For each preamble index, extract `PacketSymbols` bits from quantized signal
- Pack into bytes using `np.packbits`
- Skip indices > `BlockSize` (will appear in next block)
- Port of `Decoder.Slice`

**`Decoder` class**
- Maintains two rolling buffers: `signal` (float64) and `quantized` (uint8), each of length `BufferLength`
- `decode(block: bytes) -> list[SCMPlus]`
  1. Shift existing buffer contents left by `BlockSize`
  2. Compute magnitude of new block, append to signal buffer tail
  3. Run matched filter, append quantized result
  4. Search for preamble, slice packets, parse each

### Step 4 — `src/sdr.py`

Thin wrapper around `pyrtlsdr.RtlSdr` with a file-based fallback for development without hardware.

- `SampleSource` protocol: any object with a `read_block(n: int) -> bytes` method
- `UsbSdr(center_freq, sample_rate, gain="auto")` — wraps `RtlSdr`, reads raw uint8 IQ bytes
- `FileSampleSource(path)` — reads blocks from a raw binary file; loops on EOF so the
  pipeline can run continuously against a recorded capture during development
- Selected via `--sample-file` CLI flag; defaults to live USB when omitted

### Step 5 — `main.py`

CLI entry point wiring everything together.

- `argparse` flags: `--chip-length` (default 72), `--meter-id` (optional filter), `--duration` (optional time limit)
- Opens SDR device, creates `Decoder`, runs read loop
- For each decoded `SCMPlus` message: print JSON to stdout with timestamp
- Handles `SIGINT` for graceful shutdown

---

## Dependencies to add to `pyproject.toml`

- `numpy` — array operations throughout the signal pipeline
- `pyrtlsdr` — already listed (RTL-SDR hardware interface)

---

## Testing approach

- Unit test `crc.py` with a hand-crafted 14-byte payload whose known CCITT-16
  checksum equals the residue 0x1D0F
- Unit test `scmplus.parse()` by constructing a valid 16-byte packet from known
  field values, computing the correct CRC, and verifying round-trip parsing
- Unit test the decoder signal pipeline (magnitude, filter, search, slice) using
  synthetically generated IQ data: encode a known SCM+ packet back into a
  Manchester-coded IQ stream, run the decoder, and verify the recovered packet
  bytes match the original

Note: `rtlamr-go/assets/sample.bin` was captured to illustrate the **SCM** protocol
(the visualization scripts use 96-symbol SCM packet sizes), so it cannot be used
directly for SCM+ integration testing. Real hardware capture will be required for
an end-to-end integration test.
