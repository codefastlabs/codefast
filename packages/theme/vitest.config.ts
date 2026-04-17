import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    alias: { "#/*": "./src/*" },
    setupFiles: ["./vitest.setup.ts"],
  },
});
