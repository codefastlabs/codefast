import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import { prettierConfig } from '@codefast/style-guide/configs/utils/prettier';
import globals from 'globals';

import { typescriptRules } from '@/rules/typescript';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
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
    name: '@codefast/eslint-config/library/tsdoc',
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    ignores: ['dist/', 'build/', 'coverage/'],
    name: '@codefast/eslint-config/library/ignores',
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    name: '@codefast/eslint-config/library/languages',
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    name: '@codefast/eslint-config/library/typescript',
    rules: {
      ...typescriptRules.rules,
    },
  },
  {
    files: ['**/*.config.{js,cjs,mjs,ts,cts,mts}'],
    name: '@codefast/eslint-config/library/configs',
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
