import { config as codefast } from '@codefast/style-guide';

const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  ...codefast.configs.recommended,
  ...codefast.configs.typescript,
  {
    ignores: ['dist/', 'coverage/'],
  },
  /* {
    extends: [
      require.resolve('@vercel/style-guide/eslint/node'),
      require.resolve('@vercel/style-guide/eslint/typescript'),
      require.resolve('./eslint/recommended'),
    ],
    globals: {
      JSX: true,
      NodeJS: true,
      React: true,
      jest: true,
    },
    ignorePatterns: ['node_modules/', 'dist/', '*.js', '*.mjs', '*.cjs'],
    overrides: [
      {
        extends: [require.resolve('@vercel/style-guide/eslint/jest')],
        files: ['**!/__tests__/!**!/!*.[jt]s?(x)', '**!/?(*.)+(test).[jt]s?(x)'],
      },
    ],
    parserOptions: {
      project,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project,
        },
      },
    },
  }, */
  {
    rules: {
      /**
       * Disables the rule that disallows default exports
       */
      'import/no-default-export': 'off',
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
