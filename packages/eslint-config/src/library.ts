import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import { TYPESCRIPT_FILES } from '@codefast/style-guide/lib/constants';
import globals from 'globals';

import { importRules } from '@/rules/import';
import { typescriptRules } from '@/rules/typescript';

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
    name: '@codefast/eslint-config/library/jest',
  },
  {
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    name: '@codefast/eslint-config/library/tsdoc',
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    ignores: ['**/node_modules/', 'dist/', 'build/', 'coverage/'],
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
    files: TYPESCRIPT_FILES,
    name: '@codefast/eslint-config/library/typescript',
    rules: {
      ...typescriptRules.rules,
    },
  },
  {
    name: '@codefast/eslint-config/library/rules',
    rules: {
      ...importRules.rules,
    },
  },
];
