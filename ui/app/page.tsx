'use client';

import { useEffect, useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { fetchAggregate } from '@/lib/api';
import type { AggregateBucket, BucketSize } from '@/lib/types';
import { EnergyChart } from '@/components/EnergyChart';
import { SummaryCards } from '@/components/SummaryCards';
import { DateRangeControls } from '@/components/DateRangeControls';
import type { RangePreset } from '@/components/DateRangeControls';

function getDefaultPreset(): RangePreset {
  const now = new Date();
  return {
    label: 'Last 7 days',
    start: startOfDay(subDays(now, 6)),
    end: endOfDay(now),
    bucket: 'hour',
  };
}

export default function Dashboard() {
  const [preset, setPreset] = useState<RangePreset>(getDefaultPreset);
  const [data, setData] = useState<AggregateBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAggregate(preset.start, preset.end, preset.bucket as BucketSize)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-semibold text-gray-900">
            Energy Dashboard
          </h1>
          <DateRangeControls
            activeLabel={preset.label}
            onSelect={setPreset}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            Failed to load data: {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Loading…
          </div>
        ) : (
          <>
            <SummaryCards data={data} />
            <EnergyChart data={data} bucket={preset.bucket as BucketSize} />
          </>
        )}
      </div>
    </main>
  );
}
