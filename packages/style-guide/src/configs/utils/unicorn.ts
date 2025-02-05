import type { Linter } from 'eslint';

import unicornPlugin from 'eslint-plugin-unicorn';

import { unicornRules } from '@/rules/unicorn';

export const unicornConfig: Linter.Config = {
  ...unicornPlugin.configs['flat/recommended'],
  name: '@codefast/style-guide/configs/utils/unicorn',
  rules: {
    ...unicornPlugin.configs['flat/recommended'].rules,
    ...unicornRules.rules,
  },
};
