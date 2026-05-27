import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import { computeIsWithinRange } from '../../shared/utils/range.js';
import type { z } from 'zod';
import type { createWaterTestBodySchema, waterTestHistoryQuerySchema } from './water-test.schema.js';

type CreateBody = z.infer<typeof createWaterTestBodySchema>;
type HistoryQuery = z.infer<typeof waterTestHistoryQuerySchema>;

export async function listWaterTests(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: z.infer<typeof paginationQuerySchema>,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = { aquariumId };
  const total = await prisma.waterTest.count({ where });
  const items = await prisma.waterTest.findMany({
    where,
    orderBy: { testedAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
    include: {
      results: {
        include: { testParameter: true },
      },
    },
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

export async function createWaterTest(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  body: CreateBody,
) {
  const aquarium = await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: true });

  const parameterIds = [...new Set(body.results.map((r) => r.testParameterId))];
  const ranges = await prisma.parameterRange.findMany({
    where: {
      testParameterId: { in: parameterIds },
      waterType: aquarium.waterType,
    },
  });
  const rangeByParam = new Map(ranges.map((r) => [r.testParameterId, r]));

  return prisma.$transaction(async (tx) => {
    const test = await tx.waterTest.create({
      data: {
        aquariumId,
        testedAt: body.testedAt ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    for (const row of body.results) {
      const range = rangeByParam.get(row.testParameterId) ?? null;
      const isWithinRange = computeIsWithinRange(row.value, range);
      await tx.waterTestResult.create({
        data: {
          waterTestId: test.id,
          testParameterId: row.testParameterId,
          value: row.value,
          isWithinRange,
        },
      });
    }

    return tx.waterTest.findUniqueOrThrow({
      where: { id: test.id },
      include: {
        results: { include: { testParameter: true } },
      },
    });
  });
}

export async function getWaterTestById(prisma: PrismaClient, userId: string, id: string) {
  const test = await prisma.waterTest.findFirst({
    where: { id, aquarium: { userId } },
    include: {
      aquarium: { select: { id: true, name: true, waterType: true } },
      results: { include: { testParameter: true } },
    },
  });
  if (!test) throw notFound('Teste de água não encontrado');
  return test;
}

export async function historyForParameter(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: HistoryQuery,
) {
  const aquarium = await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const tp = await prisma.testParameter.findFirst({
    where: { name: query.parameter },
  });
  if (!tp) throw notFound('Parâmetro não encontrado pelo nome');

  const range = await prisma.parameterRange.findUnique({
    where: {
      testParameterId_waterType: {
        testParameterId: tp.id,
        waterType: aquarium.waterType,
      },
    },
  });

  const tests = await prisma.waterTest.findMany({
    where: {
      aquariumId,
      testedAt: {
        gte: query.from ?? undefined,
        lte: query.to ?? undefined,
      },
      results: {
        some: { testParameterId: tp.id },
      },
    },
    orderBy: { testedAt: 'asc' },
    include: {
      results: {
        where: { testParameterId: tp.id },
      },
    },
  });

  const points = tests
    .map((t) => {
      const r = t.results[0];
      if (!r) return null;
      return {
        testedAt: t.testedAt,
        value: r.value,
        isWithinRange: r.isWithinRange,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return {
    parameter: {
      id: tp.id,
      name: tp.name,
      unit: tp.unit,
    },
    idealRange: range
      ? { idealMin: range.idealMin, idealMax: range.idealMax, waterType: aquarium.waterType }
      : null,
    points,
  };
}
