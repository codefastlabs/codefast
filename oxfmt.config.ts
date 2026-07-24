import { defineConfig } from "oxfmt";

import { ignorePatterns } from "#/oxc.shared";

export default defineConfig({
  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  // endOfLine + insertFinalNewline live in .editorconfig (the single source —
  // oxfmt reads it), so only the non-default printWidth is set here.
  printWidth: 120,

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
  // Ignored paths (shared with oxlint — see oxc.shared.ts)
  // ---------------------------------------------------------------------------
  ignorePatterns,
});
