import type { Linter } from 'eslint';

import tsdocPlugin from 'eslint-plugin-tsdoc';

import { tsdocRules } from '@/rules/tsdoc';

/**
 * We use a plugin because `tsdoc` is not compatible with eslint version 9 or later.
 */
export const tsdocConfig: Linter.Config = {
  files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
  name: '@codefast/style-guide/configs/utils/tsdoc',
  plugins: {
    tsdoc: tsdocPlugin,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
