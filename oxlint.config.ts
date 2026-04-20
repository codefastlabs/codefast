import { defineConfig } from "oxlint";

export default defineConfig({
  env: {
    builtin: true,
  },
  ignorePatterns: [
    "**/node_modules/**",
    "**/pnpm-lock.yaml",
    "**/*.snap",
    "**/coverage/**",
    "**/.turbo/**",
    "**/dist/**",
    "**/.output/**",
    "**/.nitro/**",
    "**/.tanstack/**",
    "**/.content-collections/**",
    "**/*.tsbuildinfo",
    "apps/docs/src/routeTree.gen.ts",
  ],
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: [
        "**/*.test.{ts,tsx,mts,cts,js,jsx,mjs,cjs}",
        "**/*.spec.{ts,tsx,mts,cts,js,jsx,mjs,cjs}",
      ],
      rules: {
        // Inference from implementations is enough; explicit vi.fn<...>() everywhere is noisy.
        "vitest/require-mock-type-parameters": "off",
      },
    },
  ],
  plugins: ["import", "react", "jest", "vitest", "jsx-a11y", "typescript"],
  rules: {
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",
    "typescript/no-explicit-any": "warn",
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    curly: ["error", "all"],
  },
  settings: {
    react: {
      version: "19.2",
    },
  },
});
