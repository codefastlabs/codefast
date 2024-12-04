import { config as codefast } from '@codefast/style-guide';

import { resolve } from 'node:path';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  ...codefast.configs.recommended,
  ...codefast.configs.typescript,
  ...codefast.configs.react,
  ...codefast.configs.next,
  {
    ignores: ['.next/**', 'coverage/**'],
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
      /** Warns when Promises are used inappropriately */
      '@typescript-eslint/no-misused-promises': [
        'warn',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],

      /**
       * Disables the rule that disallows default exports
       */
      'import/no-default-export': 'off',

      /**
       * Warns when JSX components aren't in PascalCase but allows namespaces
       * TODO: Remove after upgrading the style guide to my own version.
       */
      'react/jsx-pascal-case': [
        'warn',
        {
          allowNamespace: true,
        },
      ],

      /**
       * Enforces sorting of JSX props
       * TODO: Remove after upgrading the style guide to my own version.
       */
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          ignoreCase: true,
          reservedFirst: true,
          shorthandFirst: true,
        },
      ],

      /** Warns when using unknown DOM properties but ignores specified custom elements */
      'react/no-unknown-property': [
        'warn',
        {
          ignore: ['vaul-drawer-wrapper'],
        },
      ],
    },
  },
];
