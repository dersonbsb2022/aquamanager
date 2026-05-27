import type { FastifyReply } from 'fastify';
import type { ErrorCode } from '../errors/app-error.js';

export function sendOk<T>(reply: FastifyReply, data: T, statusCode = 200): FastifyReply {
  return reply.status(statusCode).send({ data });
}

export function sendNoContent(reply: FastifyReply): FastifyReply {
  return reply.status(204).send();
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  code: ErrorCode,
): FastifyReply {
  return reply.status(statusCode).send({
    error: { message, code },
  });
}
