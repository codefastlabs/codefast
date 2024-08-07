import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';

export default defineConfig((options) => [
  {
    clean: !options.watch,
    dts: true,
    entry: ['src/**/*.{ts,tsx}'],
    external: ['react'],
    format: ['cjs', 'esm'],
    minify: !options.watch,
    sourcemap: true,
    splitting: true,
    esbuildPlugins: [sassPlugin()],
    ...options,
  },
]);
