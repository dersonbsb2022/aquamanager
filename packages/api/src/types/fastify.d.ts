import type { PrismaClient } from '@prisma/client';
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    userId?: string;
  }
}

export {};
