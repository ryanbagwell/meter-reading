export interface AggregateBucket {
  bucketStart: string;
  meterConsumptionDelta: number | null;
  solarEnergyWh: number | null;
  netImportWh: number | null;
}

export type BucketSize = 'hour' | 'day';
