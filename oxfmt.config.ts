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
    functions: ["cn", "cva", "cx", "tv"],
  },

  // ---------------------------------------------------------------------------
  // Prose wrapping
  // ---------------------------------------------------------------------------
  // Markdown only — proseWrap also governs YAML, where it would reflow a workflow's
  // folded block scalars. CHANGELOG.md is exempt: `changeset version` rewrites it in a
  // bot commit that runs no git hooks, so a prose rule there fails the release PR's gate.
  overrides: [
    {
      files: ["**/*.md"],
      excludeFiles: ["**/CHANGELOG.md"],
      options: { proseWrap: "always" },
    },
  ],

  // ---------------------------------------------------------------------------
  // Ignored paths (shared with oxlint — see oxc.shared.ts)
  // ---------------------------------------------------------------------------
  ignorePatterns,
});
