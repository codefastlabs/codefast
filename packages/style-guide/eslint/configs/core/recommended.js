import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';

import { bestPracticeRules } from '../../rules/best-practice.js';
import { es6Rules } from '../../rules/es6.js';
import { possibleErrorsRules } from '../../rules/possible-errors.js';
import { stylisticRules } from '../../rules/stylistic.js';
import { variablesRules } from '../../rules/variables.js';
import { importConfig } from '../utils/import.js';
import { commentsConfig } from '../utils/comments.js';
import { unicornConfig } from '../utils/unicorn.js';

/**
 * This is the base for both our browser and Node ESLint config files.
 * @type {import('eslint').Linter.Config[]}
 */
export const config = [
  eslint.configs.recommended,
  prettier,
  commentsConfig,
  importConfig,
  unicornConfig,
  {
    rules: {
      ...bestPracticeRules.rules,
      ...es6Rules.rules,
      ...possibleErrorsRules.rules,
      ...stylisticRules.rules,
      ...variablesRules.rules,
    },
  },
];
