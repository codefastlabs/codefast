import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.{test,bench}.{ts,tsx}"],
  unbundle: true,
});
