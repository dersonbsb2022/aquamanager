import type { PrismaClient } from '@prisma/client';
import { conflict, notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import type { z } from 'zod';
import type { createTestParameterBodySchema, updateTestParameterBodySchema } from './test-parameter.schema.js';

type CreateBody = z.infer<typeof createTestParameterBodySchema>;
type UpdateBody = z.infer<typeof updateTestParameterBodySchema>;

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

export async function createTestParameter(prisma: PrismaClient, body: CreateBody) {
  return prisma.testParameter.create({
    data: {
      name: body.name,
      unit: body.unit,
      description: body.description ?? undefined,
    },
  });
}

export async function updateTestParameter(prisma: PrismaClient, id: string, body: UpdateBody) {
  return prisma.testParameter.update({
    where: { id },
    data: {
      name: body.name,
      unit: body.unit,
      description: body.description === undefined ? undefined : body.description,
    },
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
