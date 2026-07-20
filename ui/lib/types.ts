export interface MeterReading {
  id: number;
  timestamp: string;
  endpointId: number;
  protocol: string;
  endpointType: string | null;
  consumption: number;
  tamper: number | null;
}

export interface MeterEndpoint {
  id: number;
  endpointType: string | null;
}
