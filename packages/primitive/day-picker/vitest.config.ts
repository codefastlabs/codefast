import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@/tests/': new URL('tests/', import.meta.url).pathname,
      // eslint-disable-next-line perfectionist/sort-objects -- Vite requires this order
      '@/': new URL('src/', import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
