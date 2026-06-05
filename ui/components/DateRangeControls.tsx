'use client';

import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { BucketSize } from '@/lib/types';

export interface RangePreset {
  label: string;
  start: Date;
  end: Date;
  bucket: BucketSize;
}

export function getPresets(): RangePreset[] {
  const now = new Date();
  return [
    {
      label: 'Today',
      start: startOfDay(now),
      end: endOfDay(now),
      bucket: 'hour',
    },
    {
      label: 'Last 7 days',
      start: startOfDay(subDays(now, 6)),
      end: endOfDay(now),
      bucket: 'hour',
    },
    {
      label: 'Last 30 days',
      start: startOfDay(subDays(now, 29)),
      end: endOfDay(now),
      bucket: 'day',
    },
  ];
}

interface Props {
  activeLabel: string;
  onSelect: (preset: RangePreset) => void;
}

export function DateRangeControls({ activeLabel, onSelect }: Props) {
  const presets = getPresets();
  return (
    <div className="flex gap-2 flex-wrap">
      {presets.map((p) => (
        <button
          key={p.label}
          onClick={() => onSelect(p)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeLabel === p.label
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
