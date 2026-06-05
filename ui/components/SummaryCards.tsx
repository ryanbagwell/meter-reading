'use client';

import type { AggregateBucket } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  colorClass: string;
}

function StatCard({ label, value, unit, colorClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${colorClass}`}>
        {value}{' '}
        <span className="text-sm font-normal text-gray-400">{unit}</span>
      </p>
    </div>
  );
}

export function SummaryCards({ data }: { data: AggregateBucket[] }) {
  const totalSolarKwh =
    data.reduce((sum, b) => sum + (b.solarEnergyWh ?? 0), 0) / 1000;

  // meterConsumptionDelta is in kWh (the formula in the API is delta * 1000 = Wh)
  const totalConsumptionKwh = data.reduce(
    (sum, b) => sum + (b.meterConsumptionDelta ?? 0),
    0
  );

  const totalNetImportKwh =
    data.reduce((sum, b) => sum + (b.netImportWh ?? 0), 0) / 1000;

  const isExporting = totalNetImportKwh < 0;
  const netLabel = isExporting ? 'Grid Export' : 'Grid Import';
  const netColor = isExporting ? 'text-green-600' : 'text-amber-600';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Solar Generated"
        value={totalSolarKwh.toFixed(1)}
        unit="kWh"
        colorClass="text-green-600"
      />
      <StatCard
        label={netLabel}
        value={Math.abs(totalNetImportKwh).toFixed(1)}
        unit="kWh"
        colorClass={netColor}
      />
      <StatCard
        label="House Consumption"
        value={totalConsumptionKwh.toFixed(1)}
        unit="kWh"
        colorClass="text-blue-600"
      />
    </div>
  );
}
