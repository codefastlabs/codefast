import unicornPlugin from 'eslint-plugin-unicorn';
import { type Linter } from 'eslint';

import { unicornRules } from '@/rules/unicorn';

/** @type {import('eslint').Linter.Config} */
export const unicornConfig: Linter.Config = {
  ...unicornPlugin.configs['flat/recommended'],
  rules: {
    ...unicornPlugin.configs['flat/recommended'].rules,
    ...unicornRules.rules,
  },
};
