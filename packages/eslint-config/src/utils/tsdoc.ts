import pluginTsdoc from "eslint-plugin-tsdoc";

import type { Linter } from "eslint";

/**
 * TSDoc rules for TypeScript documentation validation
 *
 * Provides ESLint rules for validating TSDoc comments in TypeScript files.
 * Uses the eslint-plugin-tsdoc plugin to enforce proper TSDoc syntax and formatting.
 *
 * Features:
 * - Validates TSDoc comment syntax according to the TSDoc specification
 * - Ensures proper formatting of documentation comments
 * - Helps maintain consistent documentation standards across TypeScript projects
 * - Warns about malformed TSDoc comments without breaking the build
 *
 * The rules are applied to all TypeScript files (.ts, .mts, .cts, .tsx) and
 * configured to show warnings rather than errors to maintain development flow
 * while encouraging proper documentation practices.
 *
 * @example
 * ```typescript
 * import { tsdocRules } from '@codefast/eslint-config';
 *
 * export default [
 *   ...tsdocRules,
 *   // your custom rules
 * ];
 * ```
 *
 * @example
 * ```typescript
 * // This will trigger a TSDoc warning due to malformed syntax:
 * /**
 *  * @param{string} name - Missing space after @param
 *  * @return Should be @returns, not @return
 *  *\/
 * function example(name: string): void {}
 * ```
 */
export const tsdocRules: Linter.Config[] = [
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      "tsdoc/syntax": "warn",
    },
  },
];
