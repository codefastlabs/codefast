import type { Linter } from 'eslint';

import jsConfig from '@eslint/js';
// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import prettierConfig from 'eslint-config-prettier';

import { commentsConfig } from '@/configs/utils/comments';
import { importConfig } from '@/configs/utils/import';
import { perfectionistConfig } from '@/configs/utils/perfectionist';
import { stylisticConfig } from '@/configs/utils/stylistic';
import { unicornConfig } from '@/configs/utils/unicorn';
import { bestPracticeRules } from '@/rules/best-practice';
import { commonRules } from '@/rules/common';
import { es6Rules } from '@/rules/es6';
import { possibleErrorsRules } from '@/rules/possible-errors';
import { variablesRules } from '@/rules/variables';

/**
 * This is the base for both our browser and Node ESLint config files.
 */
export const recommendedConfig: Linter.Config[] = [
  jsConfig.configs.recommended,
  commentsConfig,
  importConfig,
  unicornConfig,
  perfectionistConfig,
  stylisticConfig,
  {
    rules: {
      ...bestPracticeRules.rules,
      ...es6Rules.rules,
      ...possibleErrorsRules.rules,
      ...commonRules.rules,
      ...variablesRules.rules,
    },
  },
  prettierConfig,
];
