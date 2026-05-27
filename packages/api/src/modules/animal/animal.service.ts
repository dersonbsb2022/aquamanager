import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import type { z } from 'zod';
import type { createAnimalBodySchema, patchAnimalStatusSchema, updateAnimalBodySchema } from './animal.schema.js';

type CreateBody = z.infer<typeof createAnimalBodySchema>;
type UpdateBody = z.infer<typeof updateAnimalBodySchema>;
type PatchStatusBody = z.infer<typeof patchAnimalStatusSchema>;

export async function listAnimals(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: z.infer<typeof paginationQuerySchema>,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = { aquariumId };
  const total = await prisma.animal.count({ where });
  const items = await prisma.animal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

export async function createAnimal(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  body: CreateBody,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: true });
  return prisma.animal.create({
    data: {
      aquariumId,
      speciesName: body.speciesName,
      commonName: body.commonName,
      quantity: body.quantity ?? 1,
      notes: body.notes ?? undefined,
      addedDate: body.addedDate ?? undefined,
    },
  });
}

export async function updateAnimal(
  prisma: PrismaClient,
  userId: string,
  animalId: string,
  body: UpdateBody,
) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, aquarium: { userId } },
  });
  if (!animal) throw notFound('Animal não encontrado');
  return prisma.animal.update({
    where: { id: animalId },
    data: body,
  });
}

export async function patchAnimalStatus(
  prisma: PrismaClient,
  userId: string,
  animalId: string,
  body: PatchStatusBody,
) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, aquarium: { userId } },
  });
  if (!animal) throw notFound('Animal não encontrado');
  return prisma.animal.update({
    where: { id: animalId },
    data: {
      status: body.status,
      removedDate: body.removedDate ?? undefined,
    },
  });
}
