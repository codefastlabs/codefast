import { resolve } from 'node:path';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import { type Linter } from 'eslint';
// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import onlyWarn from 'eslint-plugin-only-warn';
import globals from 'globals';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  {
    ...jestConfig,
    ...jestTypescriptConfig,
    ...testingLibraryConfig,
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    plugins: {
      'only-warn': onlyWarn,
    },
  },
  {
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    ignores: ['dist', 'coverage'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
      parserOptions: {
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
    },
  },
  {
    rules: {
      /**
       * This configuration rule is part of the `@typescript-eslint` package.
       *
       * It disables the rule that enforces the removal of unnecessary type parameters in TypeScript.
       *
       * By turning off '`no-unnecessary-type-parameters`', developers can define type parameters in functions,
       * classes, or interfaces even when those parameters are not strictly required for type inference or checking.
       *
       * This can be useful in scenarios where explicit type parameters are used for consistency,
       * readability, or future-proofing code even if they are not technically required by the current implementation.
       *
       * https://typescript-eslint.io/rules/no-unnecessary-type-parameters/
       */
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',

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
