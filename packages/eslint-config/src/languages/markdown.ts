import type { ESLint, Linter } from "eslint";

import markdown from "@eslint/markdown";

export const markdownRules: Linter.Config[] = [
  {
    files: ["**/*.md"],
    language: "markdown/gfm",
    plugins: { markdown } as Record<string, ESLint.Plugin>,
    rules: {
      ...markdown.configs.recommended
        .map(({ rules }) => rules)
        .reduce((accumulator, rules) => ({ ...accumulator, ...rules }), {}),
    },
  },
];
