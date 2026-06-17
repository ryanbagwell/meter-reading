'use client';

import { Card, CardContent, Grid, Typography } from '@mui/material';
import type { MeterReading } from '@/lib/types';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function ReadingsSummary({ readings }: { readings: MeterReading[] }) {
  const latest = readings.length > 0 ? readings[0].consumption : null;
  const earliest = readings.length > 0 ? readings[readings.length - 1].consumption : null;
  const delta = latest !== null && earliest !== null ? latest - earliest : null;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          label="Latest Reading"
          value={latest !== null ? latest.toLocaleString() : '—'}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          label="Readings in Period"
          value={readings.length.toLocaleString()}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          label="Change"
          value={delta !== null ? `+${delta.toLocaleString()}` : '—'}
        />
      </Grid>
    </Grid>
  );
}
