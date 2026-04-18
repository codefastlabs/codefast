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
    {
      files: ["packages/cli/src/lib/**/domain/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["node:*", "fs", "path", "os", "child_process"],
                message:
                  "Pure domain modules must stay platform-agnostic and cannot import Node.js modules.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["packages/cli/src/lib/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["../*", "../../*", "../../../*", "../../../../*"],
                message:
                  "Relative parent imports (../) are forbidden for scalability. Use absolute aliases (#/lib/...) instead.",
              },
            ],
          },
        ],
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
