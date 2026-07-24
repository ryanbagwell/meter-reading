'use client';

import { useCallback, useEffect, useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import { fetchMeterEndpoints, fetchMeterReadings } from '@/lib/api';
import type { MeterReading } from '@/lib/types';
import { ReadingsChart } from '@/components/ReadingsChart';
import { ReadingsSummary } from '@/components/ReadingsSummary';
import { DateRangeControls } from '@/components/DateRangeControls';
import { MeterSelector } from '@/components/MeterSelector';
import type { RangePreset } from '@/components/DateRangeControls';

const SELECTED_ENDPOINT_KEY = 'meter-reading:selectedEndpoint';

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
  const [selectedEndpoint, setSelectedEndpoint] = useState<number | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [endpointTypeById, setEndpointTypeById] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load distinct endpoints (with known type, if any) once on mount.
  useEffect(() => {
    fetchMeterEndpoints()
      .then((data) => {
        setEndpoints(data.map((e) => e.id));
        setEndpointTypeById(Object.fromEntries(data.map((e) => [e.id, e.endpointType])));

        const raw = localStorage.getItem(SELECTED_ENDPOINT_KEY);
        const stored = raw !== null ? Number(raw) : null;
        if (stored !== null && data.some((e) => e.id === stored)) {
          setSelectedEndpoint(stored);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Fetch readings for the selected meter whenever preset or selection changes.
  useEffect(() => {
    if (selectedEndpoint === null) {
      setReadings([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMeterReadings(preset.start, preset.end, 0, selectedEndpoint)
      .then((data) => {
        setReadings(data);
        setEndpointTypeById((prev) => ({
          ...prev,
          [selectedEndpoint]: data[0]?.endpointType ?? prev[selectedEndpoint] ?? null,
        }));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [preset, selectedEndpoint]);

  const handleSelect = useCallback((id: number | null) => {
    setSelectedEndpoint(id);
    if (id !== null) {
      localStorage.setItem(SELECTED_ENDPOINT_KEY, String(id));
    }
  }, []);

  const currentEndpointType = selectedEndpoint !== null ? endpointTypeById[selectedEndpoint] ?? null : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
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
            <MeterSelector
              endpoints={endpoints}
              selected={selectedEndpoint}
              endpointTypeById={endpointTypeById}
              onChange={handleSelect}
            />
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
            <ReadingsSummary meterId={selectedEndpoint} readings={readings} endpointType={currentEndpointType} />
            <ReadingsChart meterId={selectedEndpoint} readings={readings} endpointType={currentEndpointType} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
