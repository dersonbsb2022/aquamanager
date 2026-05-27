import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function offsetFromPage(page: number, perPage: number): number {
  return (page - 1) * perPage;
}

export type PaginatedMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export function buildMeta(page: number, perPage: number, total: number): PaginatedMeta {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage) || 0,
  };
}
