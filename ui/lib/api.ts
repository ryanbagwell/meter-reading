import type { MeterReading } from './types';

export async function fetchMeterReadings(
  start: Date,
  end: Date,
  limit = 500,
): Promise<MeterReading[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    limit: String(limit),
  });

  const res = await fetch(`/api/meter/readings/?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
