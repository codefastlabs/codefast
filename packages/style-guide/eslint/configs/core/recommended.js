import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';

import { config as bestPracticeRules } from '../../rules/best-practice.js';
import { config as es6Rules } from '../../rules/es6.js';
import { config as possibleErrorsRules } from '../../rules/possible-errors.js';
import { config as stylisticRules } from '../../rules/stylistic.js';
import { config as variablesRules } from '../../rules/variables.js';
import { config as importConfig } from '../utils/import.js';
import { config as commentsConfig } from '../utils/comments.js';
import { config as unicornConfig } from '../utils/unicorn.js';

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
