import { defineConfig } from "tsdown";

export default defineConfig({
  logLevel: "warn",
  entry: ["src/**/*.ts", "!src/**/*.{test,spec,e2e,story,stories}.ts"],
  platform: "neutral",
  unbundle: true,
  hash: false,
});
