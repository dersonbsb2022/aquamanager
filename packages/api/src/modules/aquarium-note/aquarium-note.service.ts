import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import type { z } from 'zod';
import type { createAquariumNoteBodySchema, updateAquariumNoteBodySchema } from './aquarium-note.schema.js';

type CreateBody = z.infer<typeof createAquariumNoteBodySchema>;
type UpdateBody = z.infer<typeof updateAquariumNoteBodySchema>;

export async function listAquariumNotes(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: z.infer<typeof paginationQuerySchema>,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = { aquariumId };
  const total = await prisma.aquariumNote.count({ where });
  const items = await prisma.aquariumNote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

export async function createAquariumNote(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  body: CreateBody,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: true });
  return prisma.aquariumNote.create({
    data: {
      aquariumId,
      content: body.content.trim(),
    },
  });
}

async function findOwnedNote(prisma: PrismaClient, userId: string, noteId: string) {
  const note = await prisma.aquariumNote.findFirst({
    where: {
      id: noteId,
      aquarium: { userId },
    },
  });
  if (!note) throw notFound('Nota não encontrada');
  return note;
}

export async function updateAquariumNote(
  prisma: PrismaClient,
  userId: string,
  noteId: string,
  body: UpdateBody,
) {
  await findOwnedNote(prisma, userId, noteId);
  return prisma.aquariumNote.update({
    where: { id: noteId },
    data: { content: body.content.trim() },
  });
}

export async function deleteAquariumNote(prisma: PrismaClient, userId: string, noteId: string) {
  await findOwnedNote(prisma, userId, noteId);
  await prisma.aquariumNote.delete({ where: { id: noteId } });
}
