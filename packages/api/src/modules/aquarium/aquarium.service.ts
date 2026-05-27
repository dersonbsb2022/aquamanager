import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, type PaginatedMeta } from '../../shared/utils/pagination.js';
import type { createAquariumBodySchema, listAquariumsQuerySchema, updateAquariumBodySchema } from './aquarium.schema.js';
import type { z } from 'zod';

type ListQuery = z.infer<typeof listAquariumsQuerySchema>;
type CreateBody = z.infer<typeof createAquariumBodySchema>;
type UpdateBody = z.infer<typeof updateAquariumBodySchema>;

export type AquariumListItem = {
  id: string;
  name: string;
  volumeLiters: number;
  waterType: string;
  isActive: boolean;
  aliveQuantity: number;
  lastWaterTest: {
    id: string;
    testedAt: Date;
    summary: 'ok' | 'warning' | 'unknown';
  } | null;
};

type TestSummary = 'ok' | 'warning' | 'unknown';

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
        include: {
          results: { select: { isWithinRange: true } },
        },
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

  const mapped: AquariumListItem[] = items.map((a) => {
    const last = a.waterTests[0] ?? null;
    return {
      id: a.id,
      name: a.name,
      volumeLiters: a.volumeLiters,
      waterType: a.waterType,
      isActive: a.isActive,
      aliveQuantity: qtyByAquarium.get(a.id) ?? 0,
      lastWaterTest: last
        ? {
            id: last.id,
            testedAt: last.testedAt,
            summary: judgeTestSummary(last.results.map((r) => r.isWithinRange)),
          }
        : null,
    };
  });

  return { items: mapped, meta: buildMeta(page, perPage, total) };
}

function judgeTestSummary(flags: (boolean | null)[]): TestSummary {
  const defined = flags.filter((f): f is boolean => f !== null);
  if (defined.length === 0) return 'unknown';
  if (defined.some((f) => f === false)) return 'warning';
  return 'ok';
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
      photoUrl: body.photoUrl ?? undefined,
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

  return {
    ...aquarium,
    waterTests: undefined,
    aliveQuantity: aliveAgg._sum.quantity ?? 0,
    lastWaterTest: lastTest,
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
      photoUrl: body.photoUrl === undefined ? undefined : body.photoUrl,
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

  const latest = recentTests[0];
  let alerts: { parameter: string; value: number; isWithinRange: boolean | null }[] = [];
  if (latest) {
    alerts = latest.results
      .filter((r) => r.isWithinRange === false)
      .map((r) => ({
        parameter: r.testParameter.name,
        value: r.value,
        isWithinRange: r.isWithinRange,
      }));
  }

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
    alertsOutOfRange: alerts,
    recentWaterChanges: recentChanges,
    equipmentMaintenanceDue: equipmentDue,
  };
}
