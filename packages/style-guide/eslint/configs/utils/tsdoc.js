import tsdocPlugin from 'eslint-plugin-tsdoc';

import { tsdocRules } from '../../rules/tsdoc.js';

/** @type {import('eslint').Linter.Config} */
export const tsdocConfig = {
  plugins: {
    tsdoc: tsdocPlugin,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
