'use client';

import { useCallback, useEffect, useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { fetchMeterEndpoints, fetchMeterReadings } from '@/lib/api';
import type { MeterReading } from '@/lib/types';
import { ReadingsChart } from '@/components/ReadingsChart';
import { ReadingsSummary } from '@/components/ReadingsSummary';
import { DateRangeControls } from '@/components/DateRangeControls';
import { MeterSelector } from '@/components/MeterSelector';
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
  const [endpoints, setEndpoints] = useState<number[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<number[]>([]);
  const [readingsByMeter, setReadingsByMeter] = useState<Record<number, MeterReading[]>>({});
  const [endpointTypeById, setEndpointTypeById] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load distinct endpoint IDs once on mount.
  useEffect(() => {
    fetchMeterEndpoints()
      .then((ids) => {
        setEndpoints(ids);
        setSelectedEndpoints(ids);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Fetch readings for each selected meter whenever preset or selection changes.
  useEffect(() => {
    if (selectedEndpoints.length === 0) {
      setReadingsByMeter({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(
      selectedEndpoints.map((id) =>
        fetchMeterReadings(preset.start, preset.end, 500, id).then(
          (readings) => [id, readings] as const,
        ),
      ),
    )
      .then((pairs) => {
        setReadingsByMeter(Object.fromEntries(pairs));
        setEndpointTypeById((prev) => ({
          ...prev,
          ...Object.fromEntries(pairs.map(([id, readings]) => [id, readings[0]?.endpointType ?? null])),
        }));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [preset, selectedEndpoints]);

  const handleToggle = useCallback((id: number) => {
    setSelectedEndpoints((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAll = useCallback(() => setSelectedEndpoints(endpoints), [endpoints]);
  const handleDeselectAll = useCallback(() => setSelectedEndpoints([]), []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <MeterSelector
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        endpoints={endpoints}
        selected={selectedEndpoints}
        endpointTypeById={endpointTypeById}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Meter Readings
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 1 }}
            >
              Meters ({selectedEndpoints.length}/{endpoints.length})
            </Button>
          </Box>
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
            <ReadingsSummary readingsByMeter={readingsByMeter} />
            <ReadingsChart readingsByMeter={readingsByMeter} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
