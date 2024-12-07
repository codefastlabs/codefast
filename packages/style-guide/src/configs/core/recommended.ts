import jsConfig from '@eslint/js';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import prettierConfig from 'eslint-config-prettier';
import { type Linter } from 'eslint';

import { bestPracticeRules } from '@/rules/best-practice';
import { es6Rules } from '@/rules/es6';
import { possibleErrorsRules } from '@/rules/possible-errors';
import { stylisticRules } from '@/rules/stylistic';
import { variablesRules } from '@/rules/variables';
import { importConfig } from '@/configs/utils/import';
import { commentsConfig } from '@/configs/utils/comments';
import { unicornConfig } from '@/configs/utils/unicorn';

/**
 * This is the base for both our browser and Node ESLint config files.
 */
export const recommendedConfig: Linter.Config[] = [
  jsConfig.configs.recommended,
  commentsConfig,
  importConfig,
  unicornConfig,
  bestPracticeRules,
  es6Rules,
  possibleErrorsRules,
  stylisticRules,
  variablesRules,
  prettierConfig,
];
