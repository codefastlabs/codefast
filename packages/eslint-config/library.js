import { jest, jestTypescript, recommended, testingLibrary, typescript } from '@codefast/style-guide';

import { resolve } from 'node:path';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  ...recommended,
  ...typescript,
  {
    ...jest,
    ...jestTypescript,
    ...testingLibrary,
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['dist', 'coverage'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    rules: {
      /**
       * Disables the rule that prevents unbound methods
       *
       * @remarks This rule will be removed when upgrading to Tailwind CSS v4.
       *
       * https://typescript-eslint.io/rules/unbound-method/
       */
      '@typescript-eslint/unbound-method': 'off',

      /**
       * Disables the rule that disallows default exports
       *
       * https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
       */
      'import/no-default-export': 'off',

      /**
       * Enforces consistent blank lines between statements
       *
       * https://eslint.org/docs/latest/rules/padding-line-between-statements
       */
      'padding-line-between-statements': [
        'warn',
        {
          blankLine: 'always',
          next: 'return',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: ['const', 'let', 'var'],
        },
        {
          blankLine: 'any',
          next: ['const', 'let', 'var'],
          prev: ['const', 'let', 'var'],
        },
        {
          blankLine: 'always',
          next: '*',
          prev: 'block-like',
        },
        {
          blankLine: 'always',
          next: 'block-like',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: 'directive',
        },
        {
          blankLine: 'any',
          next: 'directive',
          prev: 'directive',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: ['case', 'default'],
        },
      ],
    },
  },
];
