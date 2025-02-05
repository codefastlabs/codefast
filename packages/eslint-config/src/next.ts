import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { nextConfig } from '@codefast/style-guide/configs/frameworks/next';
import { reactConfig } from '@codefast/style-guide/configs/frameworks/react';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { playwrightTestConfig } from '@codefast/style-guide/configs/testing/playwright-test';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import globals from 'globals';
import { cwd } from 'node:process';

import { sharedRules } from '@/rules/shared';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...nextConfig,
  {
    name: '@codefast/eslint-config/next/jest',
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
    files: ['**/?(*.)+(test|spec|e2e).[jt]s?(x)'],
    name: '@codefast/eslint-config/next/tsdoc',
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    ...playwrightTestConfig,
    files: ['**/?(*.)+(e2e).[jt]s?(x)'],
  },
  {
    files: ['**/*.d.ts'],
    name: '@codefast/eslint-config/next/dts',
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.next/', 'coverage/'],
    name: '@codefast/eslint-config/next/ignore',
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: cwd(),
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.serviceworker,
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    name: '@codefast/eslint-config/next/language-options',
  },
  {
    name: '@codefast/eslint-config/next/shared',
    rules: {
      ...sharedRules.rules,

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
       * Warns when using unknown DOM properties but ignores specified custom elements
       *
       * 🔧 Fixable -
       * https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
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
