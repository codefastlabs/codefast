import type { Linter } from "eslint";

import js from "@eslint/js";

export const baseJavaScriptRules: Linter.Config[] = [
  {
    ignores: ["**/dist/**", "**/build/**", "**/.next/**", "**/node_modules/**", "**/coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,

      // Warning rules
      "no-console": "warn",
      "no-magic-numbers": ["warn", { ignore: [0, 1, -1] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      // Error rules
      "consistent-return": "error",
      "default-case-last": "error",
      eqeqeq: ["error", "always"],
      "no-alert": "error",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-implicit-coercion": "error",
      "no-nested-ternary": "error",
      "no-unneeded-ternary": "error",
      "no-useless-concat": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-destructuring": ["error", { array: false, object: true }],
      "prefer-exponentiation-operator": "error",
      "prefer-numeric-literals": "error",
      "prefer-object-spread": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      radix: "error",
      yoda: "error",

      // Spacing rules
      "padding-line-between-statements": [
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
