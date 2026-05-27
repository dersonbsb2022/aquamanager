import { z } from 'zod';

export const createAquariumNoteBodySchema = z.object({
  content: z.string().min(1).max(5000),
});

export const updateAquariumNoteBodySchema = z.object({
  content: z.string().min(1).max(5000),
});
