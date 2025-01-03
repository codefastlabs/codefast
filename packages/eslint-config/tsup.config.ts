import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*', '!src/**/*.test.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  shims: true,
  silent: true,
  sourcemap: Boolean(options.watch),
  splitting: true,
  treeshake: true,
  ...options,
}));
