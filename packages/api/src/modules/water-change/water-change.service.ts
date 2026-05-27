import type { PrismaClient } from '@prisma/client';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import { computePercentVolume } from '../../shared/utils/percent-volume.js';
import type { z } from 'zod';
import type { createWaterChangeBodySchema } from './water-change.schema.js';

type CreateBody = z.infer<typeof createWaterChangeBodySchema>;

export async function listWaterChanges(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: z.infer<typeof paginationQuerySchema>,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = { aquariumId };
  const total = await prisma.waterChange.count({ where });
  const items = await prisma.waterChange.findMany({
    where,
    orderBy: { changedAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

export async function createWaterChange(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  body: CreateBody,
) {
  const aquarium = await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: true });
  const percentVolume = computePercentVolume(body.volumeLiters, aquarium.volumeLiters);
  return prisma.waterChange.create({
    data: {
      aquariumId,
      changedAt: body.changedAt ?? undefined,
      volumeLiters: body.volumeLiters,
      percentVolume: percentVolume ?? undefined,
      usedDechlorinator: body.usedDechlorinator,
      notes: body.notes ?? undefined,
    },
  });
}
