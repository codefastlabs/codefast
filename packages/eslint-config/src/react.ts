import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { reactConfig } from '@codefast/style-guide/configs/frameworks/react';
import { jestConfig } from '@codefast/style-guide/configs/testing/jest';
import { jestTypescriptConfig } from '@codefast/style-guide/configs/testing/jest-typescript';
import { testingLibraryConfig } from '@codefast/style-guide/configs/testing/testing-library';
import globals from 'globals';
import { resolve } from 'node:path';

import { sharedRules } from '@/rules/shared';

export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  ...reactConfig,
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
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
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
        ecmaFeatures: {
          jsx: true,
        },
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
    },
    rules: {
      ...sharedRules.rules,

      /**
       * Disables the rule that enforces using nullish coalescing operator
       *
       * https://typescript-eslint.io/rules/prefer-nullish-coalescing/
       */
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

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
