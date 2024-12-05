import {
  jest,
  jestTypescript,
  next,
  playwrightTest,
  react,
  recommended,
  testingLibrary,
  typescript,
} from '@codefast/style-guide';

import { resolve } from 'node:path';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  ...recommended,
  ...typescript,
  ...react,
  ...next,
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
    ...playwrightTest,
    files: ['**/?(*.)+(e2e).[jt]s?(x)'],
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['.next/**', 'coverage/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
      globals: {
        ...globals.serviceworker,
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    rules: {
      /**
       * Warns when Promises are used inappropriately
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-misused-promises/
       */
      '@typescript-eslint/no-misused-promises': [
        'warn',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],

      /**
       * Warns when non-string types are used in template expressions but allows numbers
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/restrict-template-expressions/
       */
      '@typescript-eslint/restrict-template-expressions': [
        'warn',
        {
          allowNumber: true,
        },
      ],

      /**
       * Disables the rule that disallows default exports
       *
       * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
       */
      'import/no-default-export': 'off',

      /**
       * Enforces consistent blank lines between statements
       *
       * 🔧 Fixable - https://eslint.org/docs/latest/rules/padding-line-between-statements
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

      /**
       * Warns when using unknown DOM properties but ignores specified custom elements
       *
       * 🔧 Fixable - https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
       */
      'react/no-unknown-property': [
        'warn',
        {
          ignore: ['vaul-drawer-wrapper'],
        },
      ],
    },
  },
];
