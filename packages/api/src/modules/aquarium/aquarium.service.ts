import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, type PaginatedMeta } from '../../shared/utils/pagination.js';
import {
  buildWaterStatusSnapshot,
  fetchLatestParameterSnapshots,
  type WaterSummary,
} from '../../shared/utils/water-parameter-snapshot.js';
import type { createAquariumBodySchema, listAquariumsQuerySchema, updateAquariumBodySchema } from './aquarium.schema.js';
import type { z } from 'zod';

type ListQuery = z.infer<typeof listAquariumsQuerySchema>;
type CreateBody = z.infer<typeof createAquariumBodySchema>;
type UpdateBody = z.infer<typeof updateAquariumBodySchema>;

export type AquariumListItem = {
  id: string;
  name: string;
  photoUrl: string | null;
  volumeLiters: number;
  waterType: string;
  isActive: boolean;
  aliveQuantity: number;
  lastWaterTest: {
    id: string;
    testedAt: Date;
    /** Situação atual: último valor de cada parâmetro já medido */
    summary: WaterSummary;
    outOfRangeCount: number;
    trackedParameterCount: number;
    outOfRangeParameters: string[];
  } | null;
  /** Sem testes registrados */
  waterStatus: WaterSummary;
};

export async function listAquariums(
  prisma: PrismaClient,
  userId: string,
  query: ListQuery,
): Promise<{ items: AquariumListItem[]; meta: PaginatedMeta }> {
  const { page, perPage, includeInactive } = query;
  const where = {
    userId,
    ...(includeInactive ? {} : { isActive: true }),
  };

  const total = await prisma.aquarium.count({ where });
  const items = await prisma.aquarium.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
    include: {
      waterTests: {
        orderBy: { testedAt: 'desc' },
        take: 1,
        select: { id: true, testedAt: true },
      },
    },
  });

  const ids = items.map((i) => i.id);
  const aggregates =
    ids.length === 0
      ? []
      : await prisma.animal.groupBy({
          by: ['aquariumId'],
          where: { aquariumId: { in: ids }, status: 'ALIVE' },
          _sum: { quantity: true },
        });
  const qtyByAquarium = new Map(aggregates.map((g) => [g.aquariumId, g._sum.quantity ?? 0]));
  const snapshotsByAquarium = await fetchLatestParameterSnapshots(prisma, ids);

  const mapped: AquariumListItem[] = items.map((a) => {
    const last = a.waterTests[0] ?? null;
    const snapshot = buildWaterStatusSnapshot(snapshotsByAquarium.get(a.id) ?? []);
    return {
      id: a.id,
      name: a.name,
      photoUrl: a.photoUrl,
      volumeLiters: a.volumeLiters,
      waterType: a.waterType,
      isActive: a.isActive,
      aliveQuantity: qtyByAquarium.get(a.id) ?? 0,
      waterStatus: snapshot.summary,
      lastWaterTest: last
        ? {
            id: last.id,
            testedAt: last.testedAt,
            summary: snapshot.summary,
            outOfRangeCount: snapshot.outOfRangeCount,
            trackedParameterCount: snapshot.trackedParameterCount,
            outOfRangeParameters: snapshot.outOfRangeParameters,
          }
        : null,
    };
  });

  return { items: mapped, meta: buildMeta(page, perPage, total) };
}

export async function createAquarium(prisma: PrismaClient, userId: string, body: CreateBody) {
  return prisma.aquarium.create({
    data: {
      userId,
      name: body.name,
      volumeLiters: body.volumeLiters,
      waterType: body.waterType,
      targetTempMin: body.targetTempMin ?? undefined,
      targetTempMax: body.targetTempMax ?? undefined,
      substrate: body.substrate ?? undefined,
      startDate: body.startDate ?? undefined,
      notes: body.notes ?? undefined,
    },
  });
}

export async function getAquariumDetail(prisma: PrismaClient, userId: string, id: string) {
  const aquarium = await prisma.aquarium.findFirst({
    where: { id, userId },
    include: {
      waterTests: {
        orderBy: { testedAt: 'desc' },
        take: 1,
        include: {
          results: {
            include: { testParameter: true },
          },
        },
      },
    },
  });
  if (!aquarium) throw notFound('Aquário não encontrado');

  const aliveAgg = await prisma.animal.aggregate({
    where: { aquariumId: id, status: 'ALIVE' },
    _sum: { quantity: true },
  });

  const lastTest = aquarium.waterTests[0] ?? null;
  const snapshotRows = (await fetchLatestParameterSnapshots(prisma, [id])).get(id) ?? [];
  const waterStatus = buildWaterStatusSnapshot(snapshotRows);
  const outOfRangeRows = snapshotRows.filter((r) => r.isWithinRange === false);
  const outOfRangeNames = outOfRangeRows.map((r) => r.parameterName);
  const ranges =
    outOfRangeNames.length === 0
      ? []
      : await prisma.parameterRange.findMany({
          where: {
            waterType: aquarium.waterType,
            testParameter: { name: { in: outOfRangeNames } },
          },
          include: { testParameter: { select: { name: true } } },
        });
  const rangeByName = new Map(ranges.map((r) => [r.testParameter.name, r]));

  const parameterAlerts = outOfRangeRows.map((r) => {
    const range = rangeByName.get(r.parameterName);
    return {
      parameterName: r.parameterName,
      unit: r.unit,
      value: r.value,
      lastTestedAt: r.lastTestedAt,
      idealMin: range?.idealMin ?? null,
      idealMax: range?.idealMax ?? null,
    };
  });

  return {
    ...aquarium,
    waterTests: undefined,
    aliveQuantity: aliveAgg._sum.quantity ?? 0,
    lastWaterTest: lastTest,
    waterStatus,
    parameterAlerts,
  };
}

export async function updateAquarium(prisma: PrismaClient, userId: string, id: string, body: UpdateBody) {
  const existing = await prisma.aquarium.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Aquário não encontrado');
  return prisma.aquarium.update({
    where: { id },
    data: {
      ...body,
      targetTempMin: body.targetTempMin === undefined ? undefined : body.targetTempMin,
      targetTempMax: body.targetTempMax === undefined ? undefined : body.targetTempMax,
      substrate: body.substrate === undefined ? undefined : body.substrate,
      startDate: body.startDate === undefined ? undefined : body.startDate,
      notes: body.notes === undefined ? undefined : body.notes,
    },
  });
}

export async function softDeleteAquarium(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.aquarium.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Aquário não encontrado');
  await prisma.aquarium.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function getAquariumSummary(prisma: PrismaClient, userId: string, aquariumId: string) {
  const aquarium = await prisma.aquarium.findFirst({ where: { id: aquariumId, userId } });
  if (!aquarium) throw notFound('Aquário não encontrado');

  const recentTests = await prisma.waterTest.findMany({
    where: { aquariumId },
    orderBy: { testedAt: 'desc' },
    take: 5,
    include: {
      results: {
        include: { testParameter: true },
      },
    },
  });

  const snapshotRows = (await fetchLatestParameterSnapshots(prisma, [aquariumId])).get(aquariumId) ?? [];
  const waterStatus = buildWaterStatusSnapshot(snapshotRows);
  const alerts = snapshotRows
    .filter((r) => r.isWithinRange === false)
    .map((r) => ({
      parameter: r.parameterName,
      value: r.value,
      isWithinRange: r.isWithinRange,
      lastTestedAt: r.lastTestedAt,
    }));

  const recentChanges = await prisma.waterChange.findMany({
    where: { aquariumId },
    orderBy: { changedAt: 'desc' },
    take: 5,
  });

  const equipmentDue = await prisma.equipment.findMany({
    where: {
      aquariumId,
      nextMaintenanceAt: { not: null, lte: new Date() },
    },
    orderBy: { nextMaintenanceAt: 'asc' },
    take: 10,
  });

  return {
    aquarium: {
      id: aquarium.id,
      name: aquarium.name,
      volumeLiters: aquarium.volumeLiters,
      waterType: aquarium.waterType,
      isActive: aquarium.isActive,
    },
    recentWaterTests: recentTests,
    waterStatus,
    alertsOutOfRange: alerts,
    recentWaterChanges: recentChanges,
    equipmentMaintenanceDue: equipmentDue,
  };
}
