'use client';

import { useEffect, useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import { fetchMeterReadings } from '@/lib/api';
import type { MeterReading } from '@/lib/types';
import { ReadingsChart } from '@/components/ReadingsChart';
import { ReadingsSummary } from '@/components/ReadingsSummary';
import { DateRangeControls } from '@/components/DateRangeControls';
import type { RangePreset } from '@/components/DateRangeControls';

function getDefaultPreset(): RangePreset {
  const now = new Date();
  return {
    label: 'Last 7 days',
    start: startOfDay(subDays(now, 6)),
    end: endOfDay(now),
  };
}

export default function Dashboard() {
  const [preset, setPreset] = useState<RangePreset>(getDefaultPreset);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMeterReadings(preset.start, preset.end)
      .then(setReadings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Meter Readings
          </Typography>
          <DateRangeControls activeLabel={preset.label} onSelect={setPreset} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load data: {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ReadingsSummary readings={readings} />
            <ReadingsChart readings={readings} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
