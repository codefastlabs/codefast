import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { nextConfig } from '@codefast/style-guide/configs/frameworks/next';
import { reactConfig } from '@codefast/style-guide/configs/frameworks/react';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { playwrightTestConfig } from '@codefast/style-guide/configs/testing/playwright-test';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import { prettierConfig } from '@codefast/style-guide/configs/utils/prettier';
import globals from 'globals';

import { typescriptRules } from '@/rules/typescript';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...nextConfig,
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
    name: '@codefast/eslint-config/next/jest',
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
    name: '@codefast/eslint-config/next/playwright',
  },
  {
    files: ['**/*.d.ts'],
    name: '@codefast/eslint-config/next/dts',
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['dist/', 'build/', '.next/', 'coverage/'],
    name: '@codefast/eslint-config/next/ignores',
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.serviceworker,
        ...globals.node,
        ...globals.browser,
      },
    },
    name: '@codefast/eslint-config/next/languages',
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    name: '@codefast/eslint-config/next/typescript',
    rules: {
      ...typescriptRules.rules,
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { attributes: false } }],
    },
  },
  {
    name: '@codefast/eslint-config/next/rules',
    rules: {
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
  {
    files: [
      '**/{default,error,forbidden,global-error,instrumentation,layout,loading,mdx-components,middleware,not-found,page,route,template,unauthorized}.{js,jsx,ts,tsx}',
    ],
    name: '@codefast/eslint-config/next/file-conventions',
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['**/*.config.{js,cjs,mjs,ts,cts,mts}'],
    name: '@codefast/eslint-config/next/configs',
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'import/no-anonymous-default-export': 'off',
      'import/no-default-export': 'off',
    },
  },
  prettierConfig,
];
