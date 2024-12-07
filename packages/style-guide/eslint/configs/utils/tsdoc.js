import tsdoc from 'eslint-plugin-tsdoc';

import { tsdocRules } from '../../rules/tsdoc.js';

/** @type {import('eslint').Linter.Config} */
export const tsdocConfig = {
  plugins: {
    tsdoc,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
