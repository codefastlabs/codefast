import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
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
    watch: false,
  },
});
