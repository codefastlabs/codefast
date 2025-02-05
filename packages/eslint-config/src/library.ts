import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import globals from 'globals';
import { resolve } from 'node:path';

import { sharedRules } from '@/rules/shared';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  {
    name: '@codefast/eslint-config/library/jest',
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
    files: ['**/?(*.)+(test|spec).[jt]s?(x)'],
    name: '@codefast/eslint-config/library/tsdoc',
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    ignores: ['dist', 'coverage'],
    name: '@codefast/eslint-config/library/ignore',
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
    name: '@codefast/eslint-config/library/shared',
    rules: {
      ...sharedRules.rules,
    },
  },
];
