import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    clean: !options.watch,
    dts: true,
    entry: ["src/**/*.{ts,tsx}"],
    minify: !options.watch,
    external: ["react"],
    format: ["cjs", "esm"],
    sourcemap: true,
    splitting: true,
    ...options,
  },
  {
    clean: !options.watch,
    entry: ["src/**/*.css"],
    minify: !options.watch,
    sourcemap: true,
    splitting: true,
    ...options,
  },
]);
