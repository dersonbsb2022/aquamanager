import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  // Carrega variáveis da raiz do monorepo (um único `.env`).
  const repoRoot = resolve(process.cwd(), '../..');
  const env = loadEnv(mode, repoRoot, '');
  const api = env.VITE_API_URL ?? 'http://localhost:3333';
  return {
    plugins: [react()],
    envDir: repoRoot,
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: api,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  };
});
