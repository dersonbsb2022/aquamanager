import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Integração opcional — exige Postgres acessível e migrações aplicadas:
 * RUN_INTEGRATION=1 DATABASE_URL=postgresql://... JWT_SECRET=(32+) JWT_REFRESH_SECRET=(32+) npm run test:integration -w @aquamanager/api
 *
 * Imports dinâmicos: não carregar app/prisma quando o teste está em skip (ex.: CI sem env).
 */
const run = process.env.RUN_INTEGRATION === '1' && Boolean(process.env.DATABASE_URL);
const describeIntegration = run ? describe : describe.skip;

describeIntegration('API HTTP (integração)', () => {
  let app: Awaited<ReturnType<(typeof import('../src/app.js'))['createApp']>>;
  let prisma: import('@prisma/client').PrismaClient;

  beforeAll(async () => {
    const appMod = await import('../src/app.js');
    const dbMod = await import('../src/config/database.js');
    prisma = dbMod.prisma;
    app = await appMod.createApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('register e login', async () => {
    const email = `u_${Date.now()}@test.local`;
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'Test', email, password: 'senha12345' },
    });
    expect(reg.statusCode).toBe(201);
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: 'senha12345' },
    });
    expect(login.statusCode).toBe(200);
    const body = login.json() as { data: { accessToken: string } };
    expect(body.data.accessToken).toBeTruthy();
  });
});
