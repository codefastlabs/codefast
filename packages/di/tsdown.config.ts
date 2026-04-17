import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.test.ts", "!src/**/*.test.tsx"],
  unbundle: true,
});
