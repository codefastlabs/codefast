import type { Linter } from 'eslint';

import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import { typescriptConfig } from '@codefast/style-guide/configs/core/typescript';
import { reactConfig } from '@codefast/style-guide/configs/frameworks/react';
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
    name: '@codefast/eslint-config/react/jest',
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
    ignores: ['**/node_modules/', 'dist/', 'build/', 'coverage/'],
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
    files: TYPESCRIPT_FILES,
    name: '@codefast/eslint-config/react/typescript',
    rules: {
      ...typescriptRules.rules,

      /**
       * Disables the rule that enforces using nullish coalescing operator
       *
       * https://typescript-eslint.io/rules/prefer-nullish-coalescing/
       */
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  {
    name: '@codefast/eslint-config/react/rules',
    rules: {
      ...importRules.rules,

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
       * 🔧 Fixable -
       * https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
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
