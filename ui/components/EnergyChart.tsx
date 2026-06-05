'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import type { AggregateBucket, BucketSize } from '@/lib/types';

interface ChartRow {
  label: string;
  solar: number | null;
  netImport: number | null;
  consumption: number | null;
}

// Django returns UTC datetimes; appending Z guarantees UTC parsing so
// date-fns format() then converts to the browser's local timezone.
function parseUTC(s: string): Date {
  const hasOffset = s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasOffset ? s : s + 'Z');
}

function toChartData(data: AggregateBucket[], bucket: BucketSize): ChartRow[] {
  return data.map((b) => ({
    label: format(
      parseUTC(b.bucketStart),
      bucket === 'hour' ? 'MMM d h aaa' : 'MMM d'
    ),
    solar: b.solarEnergyWh != null ? +(b.solarEnergyWh / 1000).toFixed(2) : null,
    netImport: b.netImportWh != null ? +(b.netImportWh / 1000).toFixed(2) : null,
    // meterConsumptionDelta is already in kWh
    consumption: b.meterConsumptionDelta,
  }));
}


interface Props {
  data: AggregateBucket[];
  bucket: BucketSize;
}

export function EnergyChart({ data, bucket }: Props) {
  const chartData = toChartData(data, bucket);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-72 text-gray-400 text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              label={{
                value: 'kWh',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { fontSize: 11, fill: '#6b7280' },
              }}
            />
            <Tooltip
              formatter={(value) => [`${value} kWh`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="solar" name="Solar Generated" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="netImport" name="Grid Import / Export" radius={[2, 2, 0, 0]}>
              {chartData.map((row, i) => (
                <Cell
                  key={i}
                  fill={(row.netImport ?? 0) >= 0 ? '#f59e0b' : '#86efac'}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="consumption"
              name="House Consumption"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
