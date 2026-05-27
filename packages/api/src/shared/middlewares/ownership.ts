import type { Aquarium, Prisma, PrismaClient } from '@prisma/client';
import { notFound } from '../errors/app-error.js';

type FindOptions = {
  /** Se true, apenas aquários ativos */
  activeOnly?: boolean;
};

export async function findOwnedAquarium(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  options: FindOptions = {},
): Promise<Aquarium> {
  const { activeOnly = false } = options;
  const aquarium = await prisma.aquarium.findFirst({
    where: {
      id: aquariumId,
      userId,
      ...(activeOnly ? { isActive: true } : {}),
    },
  });
  if (!aquarium) {
    throw notFound('Aquário não encontrado');
  }
  return aquarium;
}

export function ensureAquariumWhere(
  userId: string,
  aquariumId: string,
  activeOnly = false,
): Prisma.AquariumWhereInput {
  return {
    id: aquariumId,
    userId,
    ...(activeOnly ? { isActive: true } : {}),
  };
}
