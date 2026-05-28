import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import { evaluateParameterStatus } from '../../shared/utils/range.js';
import type { z } from 'zod';
import type {
  createWaterTestBodySchema,
  listWaterTestsQuerySchema,
  waterTestHistoryQuerySchema,
} from './water-test.schema.js';

type CreateBody = z.infer<typeof createWaterTestBodySchema>;
type HistoryQuery = z.infer<typeof waterTestHistoryQuerySchema>;
type ListQuery = z.infer<typeof listWaterTestsQuerySchema>;

export async function listWaterTests(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: ListQuery,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = {
    aquariumId,
    testedAt: {
      gte: query.from ?? undefined,
      lte: query.to ?? undefined,
    },
  };
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
  const params = await prisma.testParameter.findMany({
    where: { id: { in: parameterIds } },
    select: { id: true, name: true },
  });
  const nameByParamId = new Map(params.map((p) => [p.id, p.name]));

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
      const paramName = nameByParamId.get(row.testParameterId);
      const isWithinRange = evaluateParameterStatus(row.value, paramName, range) === 'ok';
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

export async function deleteWaterTest(prisma: PrismaClient, userId: string, id: string) {
  const test = await prisma.waterTest.findFirst({
    where: { id, aquarium: { userId } },
    select: { id: true, aquariumId: true },
  });
  if (!test) throw notFound('Teste de água não encontrado');
  await prisma.waterTest.delete({ where: { id } });
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
