import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.{ts,tsx}", "!src/**/*.{test,stories}.{ts,tsx}"],
  unbundle: true,
});
