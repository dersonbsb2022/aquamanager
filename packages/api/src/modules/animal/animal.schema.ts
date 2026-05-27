import { z } from 'zod';
import { AnimalStatus } from '@prisma/client';

export const createAnimalBodySchema = z.object({
  speciesName: z.string().min(1).max(200),
  commonName: z.string().min(1).max(200),
  quantity: z.number().int().positive().default(1),
  notes: z.string().max(5000).optional().nullable(),
  addedDate: z.coerce.date().optional(),
});

export const updateAnimalBodySchema = z.object({
  speciesName: z.string().min(1).max(200).optional(),
  commonName: z.string().min(1).max(200).optional(),
  quantity: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const patchAnimalStatusSchema = z.object({
  status: z.nativeEnum(AnimalStatus),
  removedDate: z.coerce.date().optional().nullable(),
});
