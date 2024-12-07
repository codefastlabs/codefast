import unicornPlugin from 'eslint-plugin-unicorn';

import { unicornRules } from '../../rules/unicorn.js';

/** @type {import('eslint').Linter.Config} */
export const unicornConfig = {
  ...unicornPlugin.configs['flat/recommended'],
  rules: {
    ...unicornPlugin.configs['flat/recommended'].rules,
    ...unicornRules.rules,
  },
};
