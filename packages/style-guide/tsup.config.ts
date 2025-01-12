import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  silent: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  ...options,
}));
