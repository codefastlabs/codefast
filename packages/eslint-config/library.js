import { config as codefast } from '@codefast/style-guide';

import { resolve } from 'node:path';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  ...codefast.configs.recommended,
  ...codefast.configs.typescript,
  {
    ignores: ['dist/**', 'coverage/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
    },
  },
  {
    rules: {
      /**
       * Disables the rule that disallows default exports
       */
      'import/no-default-export': 'off',

      /**
       * Disables the rule that prevents unbound methods
       *
       * @remarks This rule will be removed when upgrading to Tailwind CSS v4.

       */
      '@typescript-eslint/unbound-method': 'off',
    },
  },
];
