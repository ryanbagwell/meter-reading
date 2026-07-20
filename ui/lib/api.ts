import type { MeterReading } from './types';

export async function fetchMeterEndpoints(): Promise<number[]> {
  const res = await fetch('/api/meter/endpoints/');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchMeterReadings(
  start: Date,
  end: Date,
  limit = 0,
  meterId?: number,
): Promise<MeterReading[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    limit: String(limit),
  });
  if (meterId !== undefined) params.set('meter_id', String(meterId));

  const res = await fetch(`/api/meter/readings/?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
