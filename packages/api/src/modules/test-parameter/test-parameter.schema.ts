import { z } from 'zod';

const waterTypeSchema = z.enum(['FRESHWATER', 'SALTWATER', 'BRACKISH']);

export const parameterRangeInputSchema = z
  .object({
    waterType: waterTypeSchema,
    idealMin: z.number().nullable().optional(),
    idealMax: z.number().nullable().optional(),
  })
  .refine((r) => r.idealMin != null || r.idealMax != null, {
    message: 'Informe ideal mínimo e/ou máximo',
  })
  .refine(
    (r) => {
      if (r.idealMin != null && r.idealMax != null) return r.idealMin <= r.idealMax;
      return true;
    },
    { message: 'O mínimo deve ser menor ou igual ao máximo' },
  );

export const createTestParameterBodySchema = z
  .object({
    name: z.string().min(1).max(120),
    unit: z.string().max(32),
    description: z.string().max(2000).optional().nullable(),
    ranges: z.array(parameterRangeInputSchema).default([]),
  })
  .refine((data) => data.ranges.length > 0, {
    message: 'Cadastre a faixa ideal para pelo menos um tipo de água',
    path: ['ranges'],
  });

export const updateTestParameterBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  unit: z.string().max(32).optional(),
  description: z.string().max(2000).optional().nullable(),
  ranges: z.array(parameterRangeInputSchema).optional(),
});
