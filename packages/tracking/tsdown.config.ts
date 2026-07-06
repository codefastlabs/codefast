import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts?(x)", "!src/**/*.test.ts?(x)"],
  unbundle: true,
});
