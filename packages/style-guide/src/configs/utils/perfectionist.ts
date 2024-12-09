import type { Linter } from 'eslint';
import perfectionist from 'eslint-plugin-perfectionist';

import { perfectionistRules } from '@/rules/perfectionist';

export const perfectionistConfig: Linter.Config = {
  ...perfectionist.configs['recommended-natural'],
  rules: {
    ...perfectionistRules.rules,
  },
};
