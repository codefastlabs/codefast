import { defineConfig } from "oxfmt";

export default defineConfig({
  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  endOfLine: "lf",
  insertFinalNewline: true,
  printWidth: 120,
  proseWrap: "preserve",

  // ---------------------------------------------------------------------------
  // Code organization
  // ---------------------------------------------------------------------------
  // Deterministic import order (perfectionist-compatible algorithm). The repo
  // uses Node subpath imports ("#/") and "@/" aliases as internal modules.
  sortImports: {
    internalPattern: ["#/", "@/", "~/"],
  },
  // Stable key order across all workspace package.json files (scripts keep
  // their hand-curated order).
  sortPackageJson: true,
  // Same algorithm as prettier-plugin-tailwindcss. Sorting happens *within*
  // each class string; render-pipeline grouping across strings is handled by
  // `codefast arrange` — the two are complementary.
  sortTailwindcss: {
    stylesheet: "apps/ui/src/styles.css",
    functions: ["cn", "cva", "tv"],
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
    "apps/ui/src/routeTree.gen.ts",
    "examples/tanstack-start/src/routeTree.gen.ts",
  ],
});
