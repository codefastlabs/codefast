import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser';
import importConfig from './utils/import.js';
import commentsConfig from './utils/comments.js';
import unicornConfig from './utils/unicorn.js';
import { ECMA_VERSION, JAVASCRIPT_FILES } from '../lib/constants.js';

import bestPracticeRules from '../rules/best-practice.js';
import es6Rules from '../rules/es6.js';
import possibleErrorsRules from '../rules/possible-errors.js';
import stylisticRules from '../rules/stylistic.js';
import variablesRules from '../rules/variables.js';

/**
 * This is the base for both our browser and Node ESLint config files.
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
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
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
  },
  {
    files: JAVASCRIPT_FILES,
    ignores: ['!.*.js'],
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    languageOptions: {
      ecmaVersion: ECMA_VERSION,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
      },
    },
  },
];

export { config as default };
