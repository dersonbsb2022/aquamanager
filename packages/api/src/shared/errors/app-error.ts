export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;

  constructor(message: string, statusCode: number, code: ErrorCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFound(message = 'Recurso não encontrado'): AppError {
  return new AppError(message, 404, 'NOT_FOUND');
}

export function unauthorized(message = 'Não autorizado'): AppError {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

export function forbidden(message = 'Acesso negado'): AppError {
  return new AppError(message, 403, 'FORBIDDEN');
}

export function conflict(message: string): AppError {
  return new AppError(message, 409, 'CONFLICT');
}

export function badRequest(message: string): AppError {
  return new AppError(message, 400, 'VALIDATION_ERROR');
}
