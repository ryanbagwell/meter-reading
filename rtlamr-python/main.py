#!/usr/bin/env python3
"""rtlamr-python — Multi-protocol ERT smart meter receiver.

Reads IQ samples from an RTL-SDR dongle (or a raw sample file for testing),
decodes ERT packets, and prints each message as a JSON line to stdout.

Supported protocols (use --protocol to select; defaults to all Manchester ones):
  scmplus — Standard Consumption Message Plus (16 bytes, most electric meters)
  scm     — Standard Consumption Message (12 bytes, older electric meters)
  idm     — Interval Data Message (92 bytes, hourly interval data)
  netidm  — Net Meter Interval Data Message (92 bytes, net-metering variant)
  r900    — Neptune R900 water meters (different center freq: 912.38 MHz)

Usage:
  # All Manchester protocols on live hardware
  python main.py

  # Single protocol
  python main.py --protocol scmplus

  # From a recorded capture file
  python main.py --sample-file /path/to/capture.bin

  # Filter to a single meter once you know its ID
  python main.py --meter-id 12345678
"""

from __future__ import annotations

import argparse
import json
import logging
import signal
import sys
import time
from collections import defaultdict

from src.decoder import Config, Decoder
from src.poster import ApiPoster
from src.protocols import scm, scmplus, idm, netidm
from src.r900_decoder import R900Decoder
from src.sdr import open_source

LOG = logging.getLogger(__name__)

_MANCHESTER_PROTOCOLS = {
    "scmplus": (scmplus.make_config, scmplus.parse),
    "scm":     (scm.make_config,     scm.parse),
    "idm":     (idm.make_config,     idm.parse),
    "netidm":  (netidm.make_config,  netidm.parse),
}

# Default set omits IDM/NetIDM — their large block sizes (16 384 bytes) add
# enough Python loop overhead to cause SDR ring-buffer overflow at 2.36 MSPS
# when combined with SCM+/SCM.  Use --protocol idm / --protocol netidm to
# decode those explicitly.
_DEFAULT_PROTOCOLS = {"scmplus", "scm", "idm", "netidm"}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Multi-protocol ERT smart meter receiver")
    p.add_argument(
        "--verbose",
        action="store_true",
        help="print per-decoder stats to stderr every 500 blocks",
    )
    p.add_argument(
        "--chip-length",
        type=int,
        default=72,
        metavar="N",
        help="chip length in samples (default: 72 → ~2.36 MHz sample rate)",
    )
    p.add_argument(
        "--gain",
        default="auto",
        metavar="GAIN",
        help='tuner gain in dB or "auto" (default: auto)',
    )
    p.add_argument(
        "--meter-id",
        type=int,
        default=None,
        metavar="ID",
        help="only print messages from this EndpointID",
    )
    p.add_argument(
        "--sample-file",
        default=None,
        metavar="PATH",
        help="read raw IQ bytes from a file instead of live hardware",
    )
    p.add_argument(
        "--duration",
        type=float,
        default=0,
        metavar="SECONDS",
        help="stop after this many seconds (0 = run forever)",
    )
    p.add_argument(
        "--protocol",
        choices=list(_MANCHESTER_PROTOCOLS) + ["r900"],
        default=None,
        metavar="PROTO",
        help="decode only this protocol (default: all Manchester protocols)",
    )
    p.add_argument(
        "--api-url",
        default=None,
        metavar="URL",
        help='base URL of the REST API (e.g. "http://localhost:8000/api"); '
             "if omitted, readings are only written to stdout",
    )
    p.add_argument(
        "--api-key",
        default=None,
        metavar="KEY",
        help="value for the X-API-Key header (only needed when the API requires auth)",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        stream=sys.stderr,
    )

    args = parse_args(argv)
    chip = args.chip_length

    # Build the list of active decoders.
    # R900 uses a completely different signal chain and center frequency.
    use_r900 = args.protocol == "r900"
    if args.protocol and args.protocol != "r900":
        manchester_protos = {args.protocol: _MANCHESTER_PROTOCOLS[args.protocol]}
    elif use_r900:
        manchester_protos = {}
    else:
        manchester_protos = {k: v for k, v in _MANCHESTER_PROTOCOLS.items()
                             if k in _DEFAULT_PROTOCOLS}

    decoders: list[Decoder] = []
    for name, (make_cfg, parser) in manchester_protos.items():
        cfg = make_cfg(chip)
        LOG.info(
            "Protocol %s: chip_length=%d sample_rate=%d center_freq=%d block_size=%d",
            name, cfg.chip_length, cfg.sample_rate, cfg.center_freq, cfg.block_size,
        )
        decoders.append(Decoder(cfg, parser))

    r900_decoder: R900Decoder | None = None
    if use_r900:
        r900_decoder = R900Decoder(chip)
        LOG.info(
            "Protocol r900: chip_length=%d sample_rate=%d center_freq=%d",
            chip, r900_decoder.sample_rate, r900_decoder.center_freq,
        )

    if not decoders and r900_decoder is None:
        LOG.error("No protocols selected.")
        return 1

    # Determine center_freq and sample_rate for the SDR source.
    if r900_decoder is not None:
        center_freq = r900_decoder.center_freq
        sample_rate = r900_decoder.sample_rate
    else:
        center_freq = decoders[0].cfg.center_freq
        sample_rate = decoders[0].cfg.sample_rate

    source = open_source(
        center_freq=center_freq,
        sample_rate=sample_rate,
        gain=args.gain,
        sample_file=args.sample_file,
    )

    poster = ApiPoster(args.api_url, args.api_key) if args.api_url else None

    # Graceful shutdown on SIGINT.
    running = True

    def _stop(signum, frame):
        nonlocal running
        LOG.info("Received signal %s, stopping.", signum)
        running = False

    signal.signal(signal.SIGINT, _stop)

    start = time.monotonic()

    # Different decoders may have different block sizes.  Read at the minimum
    # block_size2 and accumulate bytes for larger-block decoders.
    # We read in multiples of min_block to reduce Python loop overhead — fewer
    # iterations per byte means less CPU time stolen from SDR USB transfers.
    all_decoder_objs = decoders + ([r900_decoder] if r900_decoder else [])
    min_block = min(d.block_size2 for d in all_decoder_objs)
    read_size = min_block * 8  # 8× fewer loop iterations, same total throughput
    buffers: dict[int, bytearray] = defaultdict(bytearray)

    # Stats tracking (used when --verbose is set).
    proto_names = list(manchester_protos) + (["r900"] if r900_decoder else [])
    _stats: dict[int, dict] = {
        id(d): {"name": name, "blocks": 0, "messages": 0}
        for d, name in zip(all_decoder_objs, proto_names)
    }
    _total_chunks = 0
    _STATS_INTERVAL = 500
    _HEARTBEAT_INTERVAL = 30  # seconds between "listening…" log lines
    _last_heartbeat = start

    try:
        while running:
            if args.duration > 0 and (time.monotonic() - start) >= args.duration:
                LOG.info("Duration reached.")
                break

            chunk = source.read_block(read_size)
            if not chunk:
                break

            _total_chunks += 1

            for d in all_decoder_objs:
                buffers[id(d)] += chunk
                buf = buffers[id(d)]
                while len(buf) >= d.block_size2:
                    block_bytes = bytes(buf[: d.block_size2])
                    del buf[: d.block_size2]
                    _stats[id(d)]["blocks"] += 1
                    for msg in d.decode(block_bytes):
                        record = {"time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
                        record.update(msg.as_dict())
                        endpoint_id = record.get("endpoint_id")
                        if args.meter_id is not None and endpoint_id != args.meter_id:
                            continue
                        _stats[id(d)]["messages"] += 1
                        sys.stdout.write(json.dumps(record) + "\n")
                        sys.stdout.flush()
                        if poster:
                            poster.submit(record)

            now = time.monotonic()
            if args.verbose and now - _last_heartbeat >= _HEARTBEAT_INTERVAL:
                elapsed = now - start
                total_printed = sum(s["messages"] for s in _stats.values())
                LOG.info("listening… t=%ds chunks=%d messages=%d", elapsed, _total_chunks, total_printed)
                _last_heartbeat = now

            if args.verbose and _total_chunks % _STATS_INTERVAL == 0:
                elapsed = time.monotonic() - start
                parts = [f"t={elapsed:.0f}s chunks={_total_chunks}"]
                for d, s in zip(all_decoder_objs, _stats.values()):
                    ds = getattr(d, "stats", {})
                    parts.append(
                        f"{s['name']}:blocks={s['blocks']}"
                        f",cands={ds.get('candidates', '?')}"
                        f",ok={ds.get('parse_ok', '?')}"
                        f",dedup={ds.get('dedup_drop', '?')}"
                        f",printed={s['messages']}"
                    )
                LOG.info("stats: %s", " | ".join(parts))

    finally:
        source.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
