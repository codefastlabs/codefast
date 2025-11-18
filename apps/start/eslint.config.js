//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  // Ignore build outputs and generated files
  // Note: tanstackConfig already ignores common build/generated directories but does not include all TanStack Start specific files.
  {
    ignores: [
      // TanStack Router auto-generated files
      '**/routeTree.gen.ts',
      // Build output directories
      '.output/**',
      '.tanstack/**',
    ],
  },
  ...tanstackConfig,
];
