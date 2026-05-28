import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
    /** Integração exige Postgres + env; rode com npm run test:integration */
    exclude: ['**/node_modules/**', '**/dist/**', '**/api.integration.test.ts'],
  },
});
