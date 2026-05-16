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
      files: ["**/*.test.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
      rules: {
        // Inference from implementations is enough; explicit vi.fn<...>() everywhere is noisy.
        "vitest/require-mock-type-parameters": "off",
      },
    },
    {
      // Command palette uses combobox + listbox ARIA roles (not native <select>/<datalist>/<dialog>).
      // The input carries aria-expanded as part of the combobox pattern (textbox + popup).
      files: ["packages/benchmark-viewer/src/app/components/palette.tsx"],
      rules: {
        "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
        "jsx-a11y/prefer-tag-over-role": "off",
        "jsx-a11y/role-supports-aria-props": "off",
      },
    },
    {
      // Viewer components use role="group" (toolbar groups) and role="status" (live regions).
      // These ARIA roles do not have direct semantic HTML equivalents in the rendering contexts used.
      files: [
        "packages/benchmark-viewer/src/app/components/app.tsx",
        "packages/benchmark-viewer/src/app/components/metrics.tsx",
      ],
      rules: {
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
  ],
  plugins: ["import", "react", "vitest", "jsx-a11y", "typescript"],
  rules: {
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",
    "typescript/array-type": [
      "error",
      {
        default: "generic",
      },
    ],
    "typescript/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
      },
    ],
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
