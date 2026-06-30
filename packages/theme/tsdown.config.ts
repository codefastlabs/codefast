import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts?(x)", "!src/**/*.{test,stories}.ts?(x)"],
  unbundle: true,
});
