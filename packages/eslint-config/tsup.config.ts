import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ["src/**/*.ts*", "!src/**/*.test.ts*"],
  format: ["cjs", "esm"],
  minify: !options.watch,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  silent: true,
  ...options,
}));
