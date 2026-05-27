import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** Carrega `.env` da raiz do monorepo e `packages/api/.env` (este sobrescreve). */
function loadDotenvFiles(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const apiRoot = resolve(here, '../..');
  const repoRoot = resolve(apiRoot, '../..');
  config({ path: resolve(repoRoot, '.env') });
  config({ path: resolve(apiRoot, '.env'), override: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  /** Pasta absoluta ou relativa para imagens; padrão: packages/api/uploads */
  UPLOAD_DIR: z.string().optional(),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(20).default(5),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  loadDotenvFiles();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${msg}`);
  }
  cached = parsed.data;
  return parsed.data;
}
