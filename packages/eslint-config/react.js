import { config as codefast } from '@codefast/style-guide';

import { resolve } from 'node:path';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export const config = [
  ...codefast.configs.recommended,
  ...codefast.configs.typescript,
  ...codefast.configs.react,
  {
    ignores: ['dist/**', 'coverage/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
    },
    rules: {
      /**
       * Disables the rule that enforces using nullish coalescing operator
       */
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      /**
       * Warns when non-string types are used in template expressions but allows numbers
       */
      '@typescript-eslint/restrict-template-expressions': [
        'warn',
        {
          allowNumber: true,
        },
      ],

      /**
       * Disables the rule that disallows default exports
       */
      'import/no-default-export': 'off',

      /**
       * Enforces consistent blank lines between statements
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
