import { jest, jestTypescript, react, recommended, testingLibrary, typescript } from '@codefast/style-guide';

import { resolve } from 'node:path';
import globals from 'globals';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export const config = [
  ...recommended,
  ...typescript,
  ...react,
  {
    ...jest,
    ...jestTypescript,
    ...testingLibrary,
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['dist/**', 'coverage/**'],
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
        ...globals.browser,
      },
    },
    rules: {
      /**
       * Disables the rule that enforces using nullish coalescing operator
       *
       * https://typescript-eslint.io/rules/prefer-nullish-coalescing/
       */
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

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
       * https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
       */
      'import/no-default-export': 'off',

      /**
       * Prevents fallthrough in switch statements but allows empty cases
       *
       * https://eslint.org/docs/latest/rules/no-fallthrough
       */
      'no-fallthrough': [
        'error',
        {
          allowEmptyCase: true,
        },
      ],

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

      /**
       * Warns when using unknown DOM properties but ignores specified custom elements
       *
       * 🔧 Fixable - https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
       */
      'react/no-unknown-property': [
        'warn',
        {
          ignore: ['cmdk-input-wrapper'],
        },
      ],
    },
  },
];
