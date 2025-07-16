import type { Linter } from "eslint";

import stylistic from "@stylistic/eslint-plugin";

export const stylisticRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      ...stylistic.configs.recommended.rules,

      // Error rules
      "@stylistic/padding-line-between-statements": [
        "error",

        // Add blank lines between variable declarations and other statements
        {
          blankLine: "always",
          next: "*",
          prev: ["const", "let", "var"],
        },
        {
          blankLine: "any",
          next: ["const", "let", "var"],
          prev: ["const", "let", "var"],
        },

        // Add blank lines between directives and other statements
        {
          blankLine: "always",
          next: "*",
          prev: "directive",
        },
        {
          blankLine: "any",
          next: "directive",
          prev: "directive",
        },

        // Add blank lines between case/default statements
        {
          blankLine: "always",
          next: "*",
          prev: ["case", "default"],
        },

        // Add blank lines before return statements
        {
          blankLine: "always",
          next: "return",
          prev: "*",
        },
      ],
    },
  },
];
