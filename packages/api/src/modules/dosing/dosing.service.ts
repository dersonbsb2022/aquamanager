import type { PrismaClient } from '@prisma/client';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import type { z } from 'zod';
import type { createDosingBodySchema } from './dosing.schema.js';

type CreateBody = z.infer<typeof createDosingBodySchema>;

export async function listDosings(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: z.infer<typeof paginationQuerySchema>,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = { aquariumId };
  const total = await prisma.dosing.count({ where });
  const items = await prisma.dosing.findMany({
    where,
    orderBy: { dosedAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

export async function createDosing(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  body: CreateBody,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: true });
  return prisma.dosing.create({
    data: {
      aquariumId,
      productName: body.productName,
      amountMl: body.amountMl,
      dosedAt: body.dosedAt ?? undefined,
      purpose: body.purpose ?? undefined,
      notes: body.notes ?? undefined,
    },
  });
}
