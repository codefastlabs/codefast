import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.{ts,tsx}", "!src/**/*.{test,bench}.{ts,tsx}"],
  unbundle: true,
});
