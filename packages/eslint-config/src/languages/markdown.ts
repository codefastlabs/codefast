import markdown from "@eslint/markdown";

import type { ESLint, Linter } from "eslint";

// Markdown file configuration
export const markdownRules: Linter.Config[] = [
  {
    files: ["**/*.md"],
    plugins: { markdown } as Record<string, ESLint.Plugin>,
    language: "markdown/gfm",
    rules: {
      ...markdown.configs.recommended
        .map(({ rules }) => rules)
        .reduce((accumulator, rules) => ({ ...accumulator, ...rules }), {}),
    },
  },
];
