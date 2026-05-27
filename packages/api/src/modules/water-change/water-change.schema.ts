import { z } from 'zod';

export const createWaterChangeBodySchema = z.object({
  changedAt: z.coerce.date().optional(),
  volumeLiters: z.number().positive(),
  usedDechlorinator: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
});
