import type { Linter } from 'eslint';
import perfectionistPlugin from 'eslint-plugin-perfectionist';

import { perfectionistRules } from '@/rules/perfectionist';

export const perfectionistConfig: Linter.Config = {
  plugins: {
    perfectionist: perfectionistPlugin,
  },
  rules: {
    ...perfectionistRules.rules,
  },
};
