import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.js';
import { unauthorized } from '../errors/app-error.js';

export async function authMiddleware(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized();
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw unauthorized();
  }
  const payload = verifyAccessToken(token);
  req.userId = payload.sub;
}
