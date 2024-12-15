import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import { type Linter } from 'eslint';
import globals from 'globals';
import { resolve } from 'node:path';

import { sharedRules } from '@/rules/shared';

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
  sharedRules,
];
