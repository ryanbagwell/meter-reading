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

function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;
  if (round) {
    niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }
  return niceFraction * 10 ** exponent;
}

function computeNiceDomain(values: number[]): [number, number] {
  let rawMin = Math.min(...values);
  let rawMax = Math.max(...values);

  if (rawMin === rawMax) {
    if (rawMin === 0) return [0, 1];
    const pad = Math.abs(rawMin) * 0.5;
    rawMin -= pad;
    rawMax += pad;
  }

  const span = rawMax - rawMin;
  const padding = span * 0.08;
  let paddedMin = rawMin - padding;
  const paddedMax = rawMax + padding;

  // Force a zero baseline when the raw min sits close to zero relative to the
  // span (typical for register/consumption readings) — but not when values
  // are large and clustered away from zero, where a zero floor would flatten
  // the line visually.
  if (rawMin >= 0 && rawMin <= span * 0.2) {
    paddedMin = 0;
  }

  const niceStep = niceNumber((paddedMax - paddedMin) / 4, true);
  const niceMin = paddedMin === 0 ? 0 : Math.floor(paddedMin / niceStep) * niceStep;
  const niceMax = Math.ceil(paddedMax / niceStep) * niceStep;

  return [niceMin, niceMax];
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
  const domain: [number, number] | undefined = isEmpty
    ? undefined
    : computeNiceDomain(data.map((d) => d.value));

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
                domain={domain}
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
