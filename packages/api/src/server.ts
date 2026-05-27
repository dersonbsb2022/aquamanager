import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await createApp();
  const host = env.NODE_ENV === 'test' ? '127.0.0.1' : '0.0.0.0';
  await app.listen({ port: env.PORT, host });
  app.log.info(`API escutando em http://${host}:${env.PORT}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
