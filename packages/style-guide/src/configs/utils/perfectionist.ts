import type { Linter } from 'eslint';

import perfectionistPlugin from 'eslint-plugin-perfectionist';

import { perfectionistRules } from '@/rules/perfectionist';

export const perfectionistConfig: Linter.Config = {
  name: 'eslint-plugin-perfectionist/recommended-natural',
  ...perfectionistPlugin.configs['recommended-natural'],
  rules: {
    ...perfectionistRules.rules,
  },
};
