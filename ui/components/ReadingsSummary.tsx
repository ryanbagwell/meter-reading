'use client';

import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import type { MeterReading } from '@/lib/types';
import { meterLabel } from '@/lib/commodity';

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

function MeterSummaryRow({
  meterId,
  readings,
  endpointType,
}: {
  meterId: number;
  readings: MeterReading[];
  endpointType: string | null;
}) {
  // API returns newest-first.
  const latest = readings.length > 0 ? readings[0].consumption : null;
  const earliest = readings.length > 0 ? readings[readings.length - 1].consumption : null;
  const delta = latest !== null && earliest !== null ? latest - earliest : null;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {meterLabel(meterId, endpointType)}
      </Typography>
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
            value={delta !== null ? `${delta.toLocaleString()}` : '—'}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export function ReadingsSummary({
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
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Select a meter to view its summary.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return <MeterSummaryRow meterId={meterId} readings={readings} endpointType={endpointType} />;
}
