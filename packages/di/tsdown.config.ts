import swc from "unplugin-swc";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.test.ts", "!src/**/*.test.tsx"],
  unbundle: true,
  plugins: [
    swc.rollup({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { decoratorVersion: "2023-11" },
        target: "esnext",
      },
    }),
  ],
});
