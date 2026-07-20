'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, Typography } from '@mui/material';
import type { MeterReading } from '@/lib/types';
import { meterLabel } from '@/lib/commodity';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function parseUTC(s: string): Date {
  const hasOffset = s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasOffset ? s : s + 'Z');
}

function formatLabel(ts: string): string {
  return format(parseUTC(ts), 'MMM d h:mm aaa');
}

type ChartRow = Record<string, string | number>;

function buildChartData(readingsByMeter: Record<number, MeterReading[]>): ChartRow[] {
  // Key by ISO minute so readings from different meters align on the same x-axis tick.
  const timeMap = new Map<string, ChartRow>();

  for (const [id, readings] of Object.entries(readingsByMeter)) {
    for (const r of [...readings].reverse()) {
      const key = r.timestamp.slice(0, 16);
      if (!timeMap.has(key)) {
        timeMap.set(key, { _key: key, label: formatLabel(r.timestamp) });
      }
      timeMap.get(key)![`m${id}`] = r.consumption;
    }
  }

  return Array.from(timeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}

export function ReadingsChart({
  readingsByMeter,
}: {
  readingsByMeter: Record<number, MeterReading[]>;
}) {
  const meterIds = Object.keys(readingsByMeter).map(Number);
  const data = buildChartData(readingsByMeter);
  const isEmpty = data.length === 0;

  return (
    <Card variant="outlined">
      <CardContent>
        {isEmpty ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 288 }}
          >
            No readings for this period
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Register',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 12,
                  style: { fontSize: 11, fill: '#6b7280' },
                }}
              />
              <Tooltip />
              <Legend />
              {meterIds.map((id, i) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={`m${id}`}
                  name={meterLabel(id, readingsByMeter[id]?.[0]?.endpointType)}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
