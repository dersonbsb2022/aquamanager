import type { FastifyBaseLogger } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import type { ErrorCode } from './app-error.js';

function isZodLike(err: unknown): err is ZodError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: string }).name === 'ZodError' &&
    Array.isArray((err as { issues?: unknown }).issues)
  );
}

export function formatZodError(err: ZodError): { status: number; message: string; code: ErrorCode } {
  const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  return { status: 422, message, code: 'VALIDATION_ERROR' };
}

export function mapUnknownError(
  err: unknown,
  log: FastifyBaseLogger,
): { status: number; message: string; code: ErrorCode } {
  if (err instanceof AppError) {
    return { status: err.statusCode, message: err.message, code: err.code };
  }
  if (err instanceof ZodError || isZodLike(err)) {
    return formatZodError(err as ZodError);
  }
  log.error(err);
  return { status: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' };
}
