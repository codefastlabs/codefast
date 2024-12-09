import type { Linter } from 'eslint';
import perfectionist from 'eslint-plugin-perfectionist';

import { perfectionistRules } from '@/rules/perfectionist';

export const perfectionistConfig: Linter.Config = {
  plugins: {
    perfectionist,
  },
  rules: {
    ...perfectionistRules.rules,
  },
};
