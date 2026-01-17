import { libraryPreset } from '@codefast/eslint-config/presets/library';

/**
 * ESLint Configuration for @codefast/tailwind-variants
 *
 * This package is a performance-critical library where micro-optimizations matter.
 * We disable certain lint rules that would hurt runtime performance:
 *
 * 1. `unicorn/no-new-array`: The rule suggests using `Array.from({length: n})` instead
 *    of `new Array(n)`. However, benchmarks show that `new Array(n)` is significantly
 *    faster (up to 2.5x) for pre-allocating arrays. This is critical in our hot paths.
 *    See: https://github.com/nicolo-ribaudo/babel-benchmarks/issues/8
 *
 * 2. `@typescript-eslint/no-unsafe-assignment`: `new Array(n)` returns `any[]` type,
 *    triggering this rule. Since we explicitly type the variable, this is safe.
 *
 * 3. `@typescript-eslint/no-unnecessary-condition`: Sometimes TypeScript infers a
 *    value as always truthy based on types, but runtime values may differ. We need
 *    these checks for safety with user-provided configurations.
 *
 * Benchmark evidence (Simple Variants):
 * - With Array.from(): 177K ops/s
 * - With new Array(): 489K ops/s (+176% improvement)
 */
export default [
  ...libraryPreset,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Performance: new Array(n) is 2.5x faster than Array.from({length: n})
      'unicorn/no-new-array': 'off',

      // Required because new Array(n) returns any[] type
      '@typescript-eslint/no-unsafe-assignment': 'off',

      // Runtime safety checks may appear "unnecessary" to TypeScript but are needed
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
];
