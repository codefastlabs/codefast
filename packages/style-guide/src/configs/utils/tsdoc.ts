import type { Linter } from 'eslint';

import tsdocPlugin from 'eslint-plugin-tsdoc';

import { tsdocRules } from '@/rules/tsdoc';

/**
 * We use a plugin because `tsdoc` is not compatible with eslint version 9 or later.
 *
 * @type {import('eslint').Linter.Config}
 */
export const tsdocConfig: Linter.Config = {
  plugins: {
    tsdoc: tsdocPlugin,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
