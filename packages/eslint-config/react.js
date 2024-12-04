import { config as codefast } from '@codefast/style-guide';

import { resolve } from 'node:path';

const project = resolve(process.cwd(), 'tsconfig.json');

/**
 * @type {import('eslint').Linter.Config[]}
 */
export const config = [
  ...codefast.configs.recommended,
  ...codefast.configs.react,
  {
    ignores: ['dist/', 'coverage/'],
  },
  /* {
    extends: [
      require.resolve('@vercel/style-guide/eslint/browser'),
      require.resolve('@vercel/style-guide/eslint/typescript'),
      require.resolve('@vercel/style-guide/eslint/react'),
      require.resolve('./eslint/recommended'),
    ],
    globals: {
      JSX: true,
      NodeJS: true,
      jest: true,
    },
    ignorePatterns: ['node_modules/', 'dist/', '*.js', '*.mjs', '*.cjs'],
    overrides: [
      {
        extends: [require.resolve('@vercel/style-guide/eslint/jest-react')],
        files: ['**!/__tests__/!**!/!*.[jt]s?(x)', '**!/?(*.)+(test).[jt]s?(x)'],
      },
      {
        extends: [require.resolve('@vercel/style-guide/eslint/playwright-test')],
        files: ['**!/e2e/!**!/!*.[jt]s?(x)', '**!/?(*.)+(spec|e2e).[jt]s?(x)'],
      },
    ],
    parserOptions: {
      project,
    },
  }, */
  {
    rules: {
      /**
       * Disables the rule that disallows default exports
       */
      'import/no-default-export': 'off',

      /**

       * Warns when JSX components aren't in PascalCase but allows namespac
       es
       * TODO: Remove after upgrading the style guide to my own version.
       */
      'react/jsx-pascal-case': [
        'warn',
        {
          allowNamespace: true,
        },
      ],

      /**

       * Enforces sorting of JSX pro
       ps
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

      /**
       * Warns when using unknown DOM properties but ignores specified custom elements
       */
      'react/no-unknown-property': [
        'warn',
        {
          ignore: ['cmdk-input-wrapper'],
        },
      ],
    },
  },
  {
    settings: {
      'import/resolver': {
        typescript: {
          project,
        },
      },
    },
  },
];
