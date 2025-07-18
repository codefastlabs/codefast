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
    },
  },
];
