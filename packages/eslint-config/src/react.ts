import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { reactConfig } from '@codefast/style-guide/configs/frameworks/react';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import { prettierConfig } from '@codefast/style-guide/configs/utils/prettier';
import globals from 'globals';

import { typescriptRules } from '@/rules/typescript';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  ...reactConfig,
  {
    ...jestConfig,
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    name: '@codefast/eslint-config/library/jest',
  },
  {
    ...jestTypescriptConfig,
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    name: '@codefast/eslint-config/library/jest/typescript',
  },
  {
    ...testingLibraryConfig,
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    name: '@codefast/eslint-config/library/testing-library',
  },
  {
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    name: '@codefast/eslint-config/react/tsdoc',
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    name: '@codefast/eslint-config/react/dts',
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['dist/', 'build/', 'coverage/'],
    name: '@codefast/eslint-config/react/ignores',
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    name: '@codefast/eslint-config/react/languages',
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    name: '@codefast/eslint-config/react/typescript',
    rules: {
      ...typescriptRules.rules,
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  {
    name: '@codefast/eslint-config/react/rules',
    rules: {
      'no-fallthrough': ['error', { allowEmptyCase: true }],
      'react/no-unknown-property': ['warn', { ignore: ['cmdk-input-wrapper'] }],
    },
  },
  {
    files: ['**/*.config.{js,cjs,mjs,ts,cts,mts}'],
    name: '@codefast/eslint-config/react/file-conventions',
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'import/no-default-export': 'off',
    },
  },
  prettierConfig,
];
