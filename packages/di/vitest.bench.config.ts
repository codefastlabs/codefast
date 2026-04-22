import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * Dedicated config for `vitest bench`: no unit-test globs, no coverage, and
 * single-worker / sequential file runs to reduce microbench noise.
 */
export default defineConfig({
  oxc: false,
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    benchmark: {
      include: ["src/**/*.bench.?(c|m)[jt]s?(x)"],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { decoratorVersion: "2023-11" },
        target: "esnext",
      },
    }),
  ],
});
