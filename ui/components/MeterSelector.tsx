'use client';

import { MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { meterLabel } from '@/lib/commodity';

interface MeterSelectorProps {
  endpoints: number[];
  selected: number | null;
  endpointTypeById: Record<number, string | null>;
  onChange: (id: number | null) => void;
}

export function MeterSelector({
  endpoints,
  selected,
  endpointTypeById,
  onChange,
}: MeterSelectorProps) {
  const value = selected === null ? '' : String(selected);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const v = event.target.value;
    onChange(v === '' ? null : Number(v));
  };

  return (
    <Select
      size="small"
      displayEmpty
      value={value}
      onChange={handleChange}
      disabled={endpoints.length === 0}
      renderValue={(v) =>
        v === '' ? 'Select a meter' : meterLabel(Number(v), endpointTypeById[Number(v)])
      }
      sx={{ minWidth: 200, ml: 1 }}
    >
      {endpoints.length === 0 ? (
        <MenuItem value="" disabled>
          No meters found
        </MenuItem>
      ) : (
        <MenuItem value="">
          <em>None selected</em>
        </MenuItem>
      )}
      {endpoints.map((id) => (
        <MenuItem key={id} value={String(id)}>
          {meterLabel(id, endpointTypeById[id])}
        </MenuItem>
      ))}
    </Select>
  );
}
