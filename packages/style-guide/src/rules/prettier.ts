import type { Linter } from 'eslint';

import { bestPracticeRules } from '@/rules/best-practice';

export const prettierRules: Linter.Config = {
  name: '@codefast/style-guide/rules/prettier',
  rules: {
    'prettier/prettier': 'warn',
    curly: bestPracticeRules.rules?.curly,
  },
};
