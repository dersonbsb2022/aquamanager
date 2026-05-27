import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadEnv } from './config/env.js';
import { prisma } from './config/database.js';
import { registerRoutes } from './app.routes.js';
import { mapUnknownError } from './shared/errors/map-error.js';

export async function createApp(): Promise<FastifyInstance> {
  const env = loadEnv();
  const app = Fastify({ logger: env.NODE_ENV !== 'test' });

  app.decorate('prisma', prisma);

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerRoutes(app);

  app.setErrorHandler((err, req, reply) => {
    const mapped = mapUnknownError(err, req.log);
    return reply.status(mapped.status).send({
      error: { message: mapped.message, code: mapped.code },
    });
  });

  return app;
}
