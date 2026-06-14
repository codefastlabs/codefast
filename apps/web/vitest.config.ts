import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { shikiPlugin } from "./vite-plugin-shiki";

// Standalone test config — Vitest picks this over `vite.config.ts`. The app's
// dev/build plugins (TanStack Start, Nitro, devtools) spin up an SSR server
// runner that errors and hangs teardown under the test runner, so the test
// environment only loads what the React component tests actually need.
// `shikiPlugin` stays in: the registry tests load `?shiki` source modules.
export default defineConfig({
  plugins: [shikiPlugin(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
