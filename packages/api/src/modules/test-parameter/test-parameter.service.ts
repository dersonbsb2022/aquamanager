import type { PrismaClient } from '@prisma/client';
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
