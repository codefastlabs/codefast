import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  shims: true,
  silent: true,
  sourcemap: true,
  ...options,
}));
