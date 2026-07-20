const COMMODITY_ERT_TYPES: Record<string, (number | string)[]> = {
  Electric: [4, 5, 7, 8],
  Gas:      [0, 1, 2, 9, 12],
  Water:    [3, 11, 13, 'r900'],
};

const ERT_TO_COMMODITY: Record<string, string> = {};
for (const [commodity, types] of Object.entries(COMMODITY_ERT_TYPES)) {
  for (const t of types) {
    ERT_TO_COMMODITY[String(t)] = commodity;
  }
}

export function commodityForEndpointType(endpointType: string | null | undefined): string | null {
  if (!endpointType) return null;
  return ERT_TO_COMMODITY[endpointType] ?? ERT_TO_COMMODITY[endpointType.toLowerCase()] ?? null;
}

export function meterLabel(id: number, endpointType: string | null | undefined): string {
  const commodity = commodityForEndpointType(endpointType);
  return commodity ? `${id} (${commodity})` : String(id);
}
