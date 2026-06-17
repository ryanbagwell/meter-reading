'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, Typography } from '@mui/material';
import type { MeterReading } from '@/lib/types';

interface ChartRow {
  label: string;
  consumption: number;
}

function parseUTC(s: string): Date {
  const hasOffset = s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasOffset ? s : s + 'Z');
}

function toChartData(readings: MeterReading[]): ChartRow[] {
  // API returns newest-first; reverse for chronological display.
  return [...readings].reverse().map((r) => ({
    label: format(parseUTC(r.timestamp), 'MMM d h:mm aaa'),
    consumption: r.consumption,
  }));
}

export function ReadingsChart({ readings }: { readings: MeterReading[] }) {
  const data = toChartData(readings);

  return (
    <Card variant="outlined">
      <CardContent>
        {data.length === 0 ? (
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
              <Tooltip formatter={(value) => [`${value}`, 'Consumption']} />
              <Line
                type="monotone"
                dataKey="consumption"
                name="Meter Reading"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
