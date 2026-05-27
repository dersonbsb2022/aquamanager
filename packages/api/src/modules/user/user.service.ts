import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import type { z } from 'zod';
import type { updateProfileBodySchema } from './user.schema.js';

type UpdateBody = z.infer<typeof updateProfileBodySchema>;

export async function getProfile(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw notFound('Usuário não encontrado');
  return user;
}

export async function updateProfile(prisma: PrismaClient, userId: string, body: UpdateBody) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: body.name,
    },
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });
  return user;
}
