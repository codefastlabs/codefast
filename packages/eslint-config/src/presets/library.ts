import { basePreset } from "@/presets/base";
import { composeConfig } from "@/utils/composer";

import type { Linter } from "eslint";

/**
 * Additional strict rules specifically for library development
 *
 * These rules enforce stricter standards that are particularly important
 * for libraries and packages that will be consumed by other developers.
 */
const libraryStrictRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      // Stricter rules for libraries
      "no-console": "warn", // Libraries shouldn't log to the console
      "@typescript-eslint/explicit-function-return-type": "warn", // Better API documentation
      "@typescript-eslint/no-explicit-any": "error", // Type safety is crucial for libraries
      "prefer-const": "error", // Consistent immutability patterns
      "no-var": "error", // Modern JavaScript practices
    },
  },
];

/**
 * Library preset configuration for npm packages and reusable libraries
 *
 * Extends the base preset with additional strict rules specifically designed
 * for library development. This preset enforces higher code quality standards
 * that are essential when creating code that will be consumed by other developers.
 *
 * Additional features over base preset:
 * - Stricter TypeScript rules for better API contracts
 * - Enhanced type safety requirements
 * - Console usage warnings (libraries shouldn't log)
 * - Explicit return type requirements for better documentation
 *
 * Perfect for:
 * - npm packages and libraries
 * - Reusable components and utilities
 * - Open source projects
 * - Internal company libraries
 * - SDK development
 *
 * @example
 * // eslint.config.js for a library project
 * import { libraryPreset } from '@codefast/eslint-config';
 *
 * export default [
 *   ...libraryPreset,
 *   {
 *     // Library-specific overrides
 *     rules: {
 *       // Allow console in development files
 *       "no-console": "off"
 *     },
 *     files: ["scripts/**", "*.config.*"]
 *   }
 * ];
 */
export const libraryPreset: Linter.Config[] = composeConfig(basePreset, libraryStrictRules);
