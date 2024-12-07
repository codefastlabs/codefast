import unicorn from 'eslint-plugin-unicorn';

import { unicornRules } from '../../rules/unicorn.js';

/** @type {import('eslint').Linter.Config} */
export const unicornConfig = {
  plugins: {
    unicorn,
  },
  rules: {
    ...unicornRules.rules,
  },
};
