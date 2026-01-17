import type { Linter } from 'eslint';

/**
 * Composes multiple ESLint configuration arrays into a single flat array.
 *
 * @deprecated Use the spread operator instead: `[...config1, ...config2]`.
 *             ESLint 9's flat config format works natively with arrays.
 *             This function will be removed in a future major version.
 *
 * @example
 * // Before (deprecated):
 * const config = composeConfig(basePreset, customRules);
 *
 * // After (recommended):
 * const config = [...basePreset, ...customRules];
 *
 * @param configs - Arrays of ESLint configuration objects to merge
 * @returns A single flattened array of ESLint configuration objects
 */
export function composeConfig(...configs: Linter.Config[][]): Linter.Config[] {
  return configs.flat();
}
