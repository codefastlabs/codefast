import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*'],
  esbuildPlugins: [sassPlugin()],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  shims: true,
  silent: true,
  sourcemap: true,
  ...options,
}));
