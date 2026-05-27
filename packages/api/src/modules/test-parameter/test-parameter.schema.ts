import { z } from 'zod';

export const createTestParameterBodySchema = z.object({
  name: z.string().min(1).max(120),
  unit: z.string().max(32),
  description: z.string().max(2000).optional().nullable(),
});

export const updateTestParameterBodySchema = createTestParameterBodySchema.partial();
