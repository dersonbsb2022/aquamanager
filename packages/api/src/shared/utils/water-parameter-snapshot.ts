import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type WaterSummary = 'ok' | 'warning' | 'unknown';

export type ParameterSnapshotRow = {
  aquariumId: string;
  parameterName: string;
  unit: string;
  value: number;
  isWithinRange: boolean | null;
  lastTestedAt: Date;
};

export type WaterStatusSnapshot = {
  summary: WaterSummary;
  trackedParameterCount: number;
  outOfRangeCount: number;
  outOfRangeParameters: string[];
};

export function judgeParameterSnapshot(flags: (boolean | null)[]): WaterSummary {
  const defined = flags.filter((f): f is boolean => f !== null);
  if (defined.length === 0) return 'unknown';
  if (defined.some((f) => f === false)) return 'warning';
  return 'ok';
}

export function buildWaterStatusSnapshot(rows: ParameterSnapshotRow[]): WaterStatusSnapshot {
  const flags = rows.map((r) => r.isWithinRange);
  const outOfRange = rows.filter((r) => r.isWithinRange === false);
  return {
    summary: judgeParameterSnapshot(flags),
    trackedParameterCount: flags.filter((f) => f !== null).length,
    outOfRangeCount: outOfRange.length,
    outOfRangeParameters: outOfRange.map((r) => r.parameterName),
  };
}

type LatestRow = {
  aquarium_id: string;
  parameter_name: string;
  parameter_unit: string;
  value: number;
  is_within_range: boolean | null;
  tested_at: Date;
};

/** Último valor registrado de cada parâmetro por aquário (Postgres DISTINCT ON). */
export async function fetchLatestParameterSnapshots(
  prisma: PrismaClient,
  aquariumIds: string[],
): Promise<Map<string, ParameterSnapshotRow[]>> {
  const byAquarium = new Map<string, ParameterSnapshotRow[]>();
  if (aquariumIds.length === 0) return byAquarium;

  const rows = await prisma.$queryRaw<LatestRow[]>`
    SELECT DISTINCT ON (wt.aquarium_id, wtr.test_parameter_id)
      wt.aquarium_id,
      tp.name AS parameter_name,
      tp.unit AS parameter_unit,
      wtr.value,
      wtr.is_within_range,
      wt.tested_at AS tested_at
    FROM water_test_results wtr
    INNER JOIN water_tests wt ON wt.id = wtr.water_test_id
    INNER JOIN test_parameters tp ON tp.id = wtr.test_parameter_id
    WHERE wt.aquarium_id IN (${Prisma.join(aquariumIds)})
    ORDER BY wt.aquarium_id, wtr.test_parameter_id, wt.tested_at DESC
  `;

  for (const row of rows) {
    const list = byAquarium.get(row.aquarium_id) ?? [];
    list.push({
      aquariumId: row.aquarium_id,
      parameterName: row.parameter_name,
      unit: row.parameter_unit,
      value: row.value,
      isWithinRange: row.is_within_range,
      lastTestedAt: row.tested_at,
    });
    byAquarium.set(row.aquarium_id, list);
  }

  return byAquarium;
}
