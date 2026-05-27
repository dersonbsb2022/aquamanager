import { z } from 'zod';

export const createDosingBodySchema = z.object({
  productName: z.string().min(1).max(200),
  amountMl: z.number().positive(),
  dosedAt: z.coerce.date().optional(),
  purpose: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
