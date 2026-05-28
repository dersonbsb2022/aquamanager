import type { FastifyInstance } from 'fastify';
import { loginBodySchema, refreshBodySchema, registerBodySchema } from './auth.schema.js';
import { loginUser, refreshSession, registerUser } from './auth.service.js';
import { sendOk } from '../../shared/http/reply.js';
import { verifyRefreshToken } from '../../shared/utils/jwt.js';

function isPublicRegisterAllowed(): boolean {
  return process.env.ALLOW_PUBLIC_REGISTER === 'true' || process.env.NODE_ENV === 'test';
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (req, reply) => {
    if (!isPublicRegisterAllowed()) {
      return reply.status(403).send({
        error: {
          message: 'Cadastro público desabilitado. Peça acesso a um administrador.',
          code: 'FORBIDDEN',
        },
      });
    }
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
