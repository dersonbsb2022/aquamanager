import type { Prisma, PrismaClient, WaterType } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;
import { conflict, notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { computeIsWithinRange } from '../../shared/utils/range.js';
import type { z } from 'zod';
import type { createTestParameterBodySchema, updateTestParameterBodySchema } from './test-parameter.schema.js';

type CreateBody = z.infer<typeof createTestParameterBodySchema>;
type UpdateBody = z.infer<typeof updateTestParameterBodySchema>;

type RangeInput = {
  waterType: WaterType;
  idealMin?: number | null;
  idealMax?: number | null;
};

export async function listTestParameters(prisma: PrismaClient, query: z.infer<typeof paginationQuerySchema>) {
  const { page, perPage } = query;
  const total = await prisma.testParameter.count();
  const items = await prisma.testParameter.findMany({
    orderBy: { name: 'asc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
    include: { ranges: true },
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

async function upsertParameterRanges(
  prisma: Db,
  testParameterId: string,
  ranges: RangeInput[],
): Promise<void> {
  for (const r of ranges) {
    await prisma.parameterRange.upsert({
      where: {
        testParameterId_waterType: {
          testParameterId,
          waterType: r.waterType,
        },
      },
      create: {
        testParameterId,
        waterType: r.waterType,
        idealMin: r.idealMin ?? null,
        idealMax: r.idealMax ?? null,
      },
      update: {
        idealMin: r.idealMin ?? null,
        idealMax: r.idealMax ?? null,
      },
    });
  }
}

/** Recalcula isWithinRange de todos os resultados deste parâmetro (após alterar faixas). */
export async function recomputeResultsForParameter(prisma: Db, testParameterId: string): Promise<void> {
  const [results, ranges, param] = await Promise.all([
    prisma.waterTestResult.findMany({
      where: { testParameterId },
      include: {
        waterTest: { include: { aquarium: { select: { waterType: true } } } },
      },
    }),
    prisma.parameterRange.findMany({ where: { testParameterId } }),
    prisma.testParameter.findUnique({ where: { id: testParameterId }, select: { name: true } }),
  ]);
  if (!param) return;

  const rangeByWater = new Map(ranges.map((r) => [r.waterType, r]));

  for (const result of results) {
    const wt = result.waterTest.aquarium.waterType;
    const range = rangeByWater.get(wt) ?? null;
    const isWithinRange = computeIsWithinRange(result.value, range, param.name);
    await prisma.waterTestResult.update({
      where: { id: result.id },
      data: { isWithinRange },
    });
  }
}

export async function createTestParameter(prisma: PrismaClient, body: CreateBody) {
  return prisma.$transaction(async (tx) => {
    const param = await tx.testParameter.create({
      data: {
        name: body.name,
        unit: body.unit,
        description: body.description ?? undefined,
      },
    });
    await upsertParameterRanges(tx, param.id, body.ranges);
    await recomputeResultsForParameter(tx, param.id);
    return tx.testParameter.findUniqueOrThrow({
      where: { id: param.id },
      include: { ranges: true },
    });
  });
}

export async function updateTestParameter(prisma: PrismaClient, id: string, body: UpdateBody) {
  const existing = await prisma.testParameter.findUnique({ where: { id } });
  if (!existing) throw notFound('Parâmetro não encontrado');

  return prisma.$transaction(async (tx) => {
    await tx.testParameter.update({
      where: { id },
      data: {
        name: body.name,
        unit: body.unit,
        description: body.description === undefined ? undefined : body.description,
      },
    });
    if (body.ranges) {
      await upsertParameterRanges(tx, id, body.ranges);
      await recomputeResultsForParameter(tx, id);
    }
    return tx.testParameter.findUniqueOrThrow({
      where: { id },
      include: { ranges: true },
    });
  });
}

export async function deleteTestParameter(prisma: PrismaClient, id: string) {
  const existing = await prisma.testParameter.findUnique({ where: { id } });
  if (!existing) throw notFound('Parâmetro não encontrado');

  const inUse = await prisma.waterTestResult.count({ where: { testParameterId: id } });
  if (inUse > 0) {
    throw conflict('Este parâmetro já foi usado em testes de água e não pode ser excluído.');
  }

  await prisma.testParameter.delete({ where: { id } });
}
