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
      files: ["benchmarks/**/*.{js,ts,tsx}"],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: [
        "apps/docs/src/components/default-catch-boundary.tsx",
        "apps/docs/src/components/sink/app/component-wrapper.tsx",
        "apps/docs/src/components/sink/forms/notion-prompt-form.tsx",
        "packages/ui/src/hooks/use-copy-to-clipboard.ts",
        "packages/theme/src/core/provider.tsx",
      ],
      rules: {
        "no-console": "off",
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
    "no-console": "error",
    "no-debugger": "error",
  },
  settings: {
    react: {
      version: "19.2",
    },
  },
});
