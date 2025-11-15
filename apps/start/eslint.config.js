//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  // Ignore TanStack Router auto-generated files
  // Note: tanstackConfig already ignores common build/generated directories but does not include routeTree.gen.ts, so we add it here.
  // This file is auto-generated and should not be linted or formatted.
  {
    ignores: ['**/routeTree.gen.ts'],
  },
  ...tanstackConfig,
]
