import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*', '!src/**/*.test.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  shims: true,
  silent: true,
  sourcemap: true,
  splitting: true,
  ...options,
}));
