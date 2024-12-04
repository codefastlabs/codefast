import tsdoc from 'eslint-plugin-tsdoc';

import { config as tsdocRules } from '../../rules/tsdoc.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  plugins: {
    tsdoc,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
