import type { PrismaClient } from '@prisma/client';
import { notFound } from '../../shared/errors/app-error.js';
import { buildMeta, offsetFromPage, paginationQuerySchema } from '../../shared/utils/pagination.js';
import { findOwnedAquarium } from '../../shared/middlewares/ownership.js';
import type { z } from 'zod';
import type {
  createEquipmentBodySchema,
  equipmentMaintenanceBodySchema,
  updateEquipmentBodySchema,
} from './equipment.schema.js';

type CreateBody = z.infer<typeof createEquipmentBodySchema>;
type UpdateBody = z.infer<typeof updateEquipmentBodySchema>;
type MaintBody = z.infer<typeof equipmentMaintenanceBodySchema>;

export async function listEquipments(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  query: z.infer<typeof paginationQuerySchema>,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: false });
  const { page, perPage } = query;
  const where = { aquariumId };
  const total = await prisma.equipment.count({ where });
  const items = await prisma.equipment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offsetFromPage(page, perPage),
    take: perPage,
  });
  return { items, meta: buildMeta(page, perPage, total) };
}

export async function createEquipment(
  prisma: PrismaClient,
  userId: string,
  aquariumId: string,
  body: CreateBody,
) {
  await findOwnedAquarium(prisma, userId, aquariumId, { activeOnly: true });
  return prisma.equipment.create({
    data: {
      aquariumId,
      type: body.type,
      brand: body.brand ?? undefined,
      model: body.model ?? undefined,
      installedAt: body.installedAt ?? undefined,
      lastMaintenanceAt: body.lastMaintenanceAt ?? undefined,
      nextMaintenanceAt: body.nextMaintenanceAt ?? undefined,
      notes: body.notes ?? undefined,
    },
  });
}

export async function updateEquipment(
  prisma: PrismaClient,
  userId: string,
  equipmentId: string,
  body: UpdateBody,
) {
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, aquarium: { userId } },
  });
  if (!equipment) throw notFound('Equipamento não encontrado');
  return prisma.equipment.update({
    where: { id: equipmentId },
    data: body,
  });
}

export async function recordEquipmentMaintenance(
  prisma: PrismaClient,
  userId: string,
  equipmentId: string,
  body: MaintBody,
) {
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, aquarium: { userId } },
  });
  if (!equipment) throw notFound('Equipamento não encontrado');
  return prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      lastMaintenanceAt: body.performedAt,
      nextMaintenanceAt: body.nextMaintenanceAt ?? undefined,
    },
  });
}

export async function deleteEquipment(prisma: PrismaClient, userId: string, equipmentId: string) {
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, aquarium: { userId } },
  });
  if (!equipment) throw notFound('Equipamento não encontrado');
  await prisma.equipment.delete({ where: { id: equipmentId } });
}
