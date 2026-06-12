import { defineConfig } from "oxlint";

export default defineConfig({
  env: {
    builtin: true,
  },

  // ---------------------------------------------------------------------------
  // Plugins & categories
  // ---------------------------------------------------------------------------
  // Built-in plugins relevant to this monorepo: TypeScript libraries (di,
  // tailwind-variants, cli), React 19 UI packages (ui, theme, benchmark-viewer),
  // a TanStack Start app (web), and vitest test suites.
  plugins: ["import", "jsx-a11y", "node", "oxc", "promise", "react", "typescript", "unicorn", "vitest"],
  // Correctness only (oxlint's recommended default scope) — broader categories
  // (suspicious, pedantic) are too noisy for this codebase under denyWarnings.
  categories: {
    correctness: "error",
  },

  // ---------------------------------------------------------------------------
  // Linter behavior
  // ---------------------------------------------------------------------------
  options: {
    // Warnings fail CI — policy lives here instead of only in CLI flags.
    denyWarnings: true,
    // Stale `oxlint-disable` / `eslint-disable` comments rot fast; flag them.
    reportUnusedDisableDirectives: "warn",
    // Type-aware rules via oxlint-tsgolint (no-floating-promises, …).
    typeAware: true,
  },

  // ---------------------------------------------------------------------------
  // Project-wide rules (beyond category defaults)
  // ---------------------------------------------------------------------------
  rules: {
    // React hooks contracts.
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",

    // House style: generic array syntax (Array<T>), separate `import type`.
    "typescript/array-type": ["error", { default: "generic" }],
    "typescript/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "separate-type-imports" }],
    "typescript/no-explicit-any": "warn",

    // Type-aware promise safety (requires `typeAware: true`).
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",

    // Module graph hygiene.
    "import/no-cycle": "error",
    "import/no-self-import": "error",

    // Always-braced control flow.
    curly: ["error", "all"],
  },

  // ---------------------------------------------------------------------------
  // Scoped exceptions
  // ---------------------------------------------------------------------------
  overrides: [
    {
      files: ["**/*.test.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
      rules: {
        // Type-level tests assert via expectTypeOf/assertType from expect-type.
        "vitest/expect-expect": ["warn", { assertFunctionNames: ["expect", "expectTypeOf", "assertType"] }],
        // Inference from implementations is enough; explicit vi.fn<...>() everywhere is noisy.
        "vitest/require-mock-type-parameters": "off",
      },
    },
    {
      // UI primitives, docs, and viewer components use intentional ARIA roles
      // (role="group", role="progressbar", role="status", role="list") that have
      // no semantic-equivalent HTML tag in these contexts — e.g. role="progressbar"
      // on <svg>, role="group" on layout divs, role="status" live regions.
      files: [
        "apps/web/src/**/*.{ts,tsx}",
        "packages/benchmark-viewer/src/**/*.{ts,tsx}",
        "packages/ui/src/**/*.{ts,tsx}",
      ],
      rules: {
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      // Hot-path preallocation: `new Array(n)` is intentional in these
      // benchmark-backed packages; `Array.from({ length: n })` is slower.
      files: ["packages/di/src/**/*.ts", "packages/tailwind-variants/src/**/*.ts"],
      rules: {
        "unicorn/no-new-array": "off",
      },
    },
    {
      // collectCnCallsInsideTv threads `sourceFile` through recursion as part
      // of its published API signature; dropping the parameter would be a
      // breaking change for @codefast/cli consumers.
      files: ["packages/cli/src/arrange/domain/ast/collectors-tv.ts"],
      rules: {
        "oxc/only-used-in-recursion": "off",
      },
    },
    {
      // Command palette uses combobox + listbox ARIA roles (not native
      // <select>/<datalist>/<dialog>). The input carries aria-expanded as part
      // of the combobox pattern (textbox + popup).
      files: ["packages/benchmark-viewer/src/app/components/palette.tsx"],
      rules: {
        "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
        "jsx-a11y/role-supports-aria-props": "off",
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // Plugin settings
  // ---------------------------------------------------------------------------
  settings: {
    react: {
      version: "19.2",
    },
  },

  // ---------------------------------------------------------------------------
  // Ignored paths (generated output, caches, lockfiles)
  // ---------------------------------------------------------------------------
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
    "apps/web/src/routeTree.gen.ts",
  ],
});
