export interface MeterReading {
  id: number;
  timestamp: string;
  endpointId: number;
  protocol: string;
  endpointType: number | null;
  consumption: number;
  tamper: number | null;
}
