import { z } from 'zod';

export const waterTestResultInputSchema = z.object({
  testParameterId: z.string().uuid(),
  value: z.number().finite(),
});

export const createWaterTestBodySchema = z.object({
  testedAt: z.coerce.date().optional(),
  notes: z.string().max(5000).optional().nullable(),
  results: z.array(waterTestResultInputSchema).min(1),
});

export const waterTestHistoryQuerySchema = z.object({
  parameter: z.string().min(1),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const listWaterTestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
