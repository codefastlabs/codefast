import type { Linter } from 'eslint';

import tsdocPlugin from 'eslint-plugin-tsdoc';

import { TYPESCRIPT_FILES } from '@/lib/constants';
import { tsdocRules } from '@/rules/tsdoc';

/**
 * We use a plugin because `tsdoc` is not compatible with eslint version 9 or later.
 */
export const tsdocConfig: Linter.Config = {
  files: TYPESCRIPT_FILES,
  name: '@codefast/style-guide/configs/utils/tsdoc',
  plugins: {
    tsdoc: tsdocPlugin,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
