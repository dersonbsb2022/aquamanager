import { z } from 'zod';
import { WaterType } from '@prisma/client';

export const listAquariumsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.coerce.boolean().optional().default(false),
});

export const createAquariumBodySchema = z.object({
  name: z.string().min(1).max(200),
  volumeLiters: z.number().positive(),
  waterType: z.nativeEnum(WaterType).default(WaterType.FRESHWATER),
  targetTempMin: z.number().optional().nullable(),
  targetTempMax: z.number().optional().nullable(),
  substrate: z.string().max(500).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  photoUrl: z.string().url().max(2000).optional().nullable(),
});

export const updateAquariumBodySchema = createAquariumBodySchema.partial();
