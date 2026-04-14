import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/**/*.ts",
    "!**/*.test.ts",
    "!**/*.spec.ts",
    "!**/*.integration.test.ts",
    "!**/tests/**",
  ],
});
