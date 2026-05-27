import type { FastifyInstance } from 'fastify';
import { loginBodySchema, refreshBodySchema, registerBodySchema } from './auth.schema.js';
import { loginUser, refreshSession, registerUser } from './auth.service.js';
import { sendOk } from '../../shared/http/reply.js';
import { verifyRefreshToken } from '../../shared/utils/jwt.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (req, reply) => {
    const body = registerBodySchema.parse(req.body);
    const result = await registerUser(app.prisma, body);
    return sendOk(reply, result, 201);
  });

  app.post('/login', async (req, reply) => {
    const body = loginBodySchema.parse(req.body);
    const result = await loginUser(app.prisma, body);
    return sendOk(reply, result);
  });

  app.post('/refresh', async (req, reply) => {
    const body = refreshBodySchema.parse(req.body);
    const payload = verifyRefreshToken(body.refreshToken);
    const tokens = refreshSession(payload.sub);
    return sendOk(reply, tokens);
  });
}
