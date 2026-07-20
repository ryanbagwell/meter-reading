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
import { meterLabel } from '@/lib/commodity';

const LINE_COLOR = '#3b82f6';

function parseUTC(s: string): Date {
  const hasOffset = s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasOffset ? s : s + 'Z');
}

function formatLabel(ts: string): string {
  return format(parseUTC(ts), 'MMM d h:mm aaa');
}

type ChartRow = { label: string; value: number };

function buildChartData(readings: MeterReading[]): ChartRow[] {
  return [...readings].reverse().map((r) => ({
    label: formatLabel(r.timestamp),
    value: r.consumption,
  }));
}

export function ReadingsChart({
  meterId,
  readings,
  endpointType,
}: {
  meterId: number | null;
  readings: MeterReading[];
  endpointType: string | null;
}) {
  if (meterId === null) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 288 }}
          >
            Select a meter to view its chart.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const data = buildChartData(readings);
  const isEmpty = data.length === 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {meterLabel(meterId, endpointType)}
        </Typography>
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
              <Line
                type="monotone"
                dataKey="value"
                stroke={LINE_COLOR}
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
