import unicorn from 'eslint-plugin-unicorn';

import { config as unicornRules } from '../../rules/unicorn.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  plugins: {
    unicorn,
  },
  rules: {
    ...unicornRules.rules,
  },
};
