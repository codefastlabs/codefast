import js from "@eslint/js";

import type { Linter } from "eslint";

/**
 * Base JavaScript rules for modern development
 *
 * Provides foundational ESLint rules for JavaScript projects with modern ES6+ practices.
 * Includes recommended rules from @eslint/js plus additional rules for:
 * - Modern JavaScript syntax (const, arrow functions, template literals)
 * - Code quality and consistency
 * - Performance optimizations
 * - Common anti-patterns prevention
 *
 * @example
 * ```ts
 * import { baseJavaScriptRules } from '@codefast/eslint-config';
 *
 * export default [
 *   ...baseJavaScriptRules,
 *   // your custom rules
 * ];
 * ```
 */
export const baseJavaScriptRules: Linter.Config[] = [
  {
    ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "**/coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,
      // Modern JavaScript practices
      "prefer-const": "error",
      "no-var": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "prefer-destructuring": ["error", { object: true, array: false }],
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "object-shorthand": "error",
      "no-useless-concat": "error",
      "no-useless-return": "error",
      "no-useless-rename": "error",
      "no-duplicate-imports": "error",
      "no-console": "warn",
      "no-debugger": "error",
      "no-alert": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "consistent-return": "error",
      "default-case-last": "error",
      eqeqeq: ["error", "always"],
      "no-implicit-coercion": "error",
      "no-magic-numbers": ["warn", { ignore: [0, 1, -1] }],
      "no-nested-ternary": "error",
      "no-unneeded-ternary": "error",
      "prefer-exponentiation-operator": "error",
      "prefer-numeric-literals": "error",
      "prefer-object-spread": "error",
      radix: "error",
      yoda: "error",
    },
  },
];
