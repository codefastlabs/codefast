import tsdocPlugin from 'eslint-plugin-tsdoc';

import { tsdocRules } from '../../rules/tsdoc.js';

/**
 * We use a plugin because `tsdoc` is not compatible with eslint version 9 or higher.
 *
 * @type {import('eslint').Linter.Config}
 */
export const tsdocConfig = {
  plugins: {
    tsdoc: tsdocPlugin,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
