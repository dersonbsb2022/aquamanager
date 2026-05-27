import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
});
