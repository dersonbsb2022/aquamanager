import { z } from 'zod';
import { EquipmentType } from '@prisma/client';

export const createEquipmentBodySchema = z.object({
  type: z.nativeEnum(EquipmentType),
  brand: z.string().max(120).optional().nullable(),
  model: z.string().max(120).optional().nullable(),
  installedAt: z.coerce.date().optional().nullable(),
  lastMaintenanceAt: z.coerce.date().optional().nullable(),
  nextMaintenanceAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateEquipmentBodySchema = createEquipmentBodySchema.partial();

export const equipmentMaintenanceBodySchema = z.object({
  performedAt: z.coerce.date(),
  nextMaintenanceAt: z.coerce.date().optional().nullable(),
});
