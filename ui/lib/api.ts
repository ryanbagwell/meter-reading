import type { AggregateBucket, BucketSize } from './types';

export async function fetchAggregate(
  start: Date,
  end: Date,
  bucket: BucketSize
): Promise<AggregateBucket[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    bucket,
  });

  const res = await fetch(`/api/proxy/aggregate?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
