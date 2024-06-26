const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('@vercel/style-guide/eslint/next'),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  ignorePatterns: ['node_modules/', '.next/'],
  overrides: [
    {
      extends: [require.resolve('@vercel/style-guide/eslint/jest')],
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
    },
  ],
  parserOptions: {
    project,
  },
  plugins: ['only-warn'],
  rules: {
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowNumber: true,
      },
    ],
    curly: ['error', 'all'],
    'import/no-default-export': 'off',
    'import/order': [
      'warn',
      {
        groups: [
          'builtin', // Node.js built-in modules
          'external', // Packages
          'internal', // Aliased modules
          'parent', // Relative parent
          'sibling', // Relative sibling
          'index', // Relative index
        ],
        'newlines-between': 'never',
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
          },
        ],
      },
    ],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        next: 'return',
        prev: '*',
      },
      {
        blankLine: 'always',
        next: '*',
        prev: ['const', 'let', 'var'],
      },
      {
        blankLine: 'any',
        next: ['const', 'let', 'var'],
        prev: ['const', 'let', 'var'],
      },
      {
        blankLine: 'always',
        next: '*',
        prev: 'block-like',
      },
      {
        blankLine: 'always',
        next: 'block-like',
        prev: '*',
      },
      {
        blankLine: 'always',
        next: '*',
        prev: 'directive',
      },
      {
        blankLine: 'any',
        next: 'directive',
        prev: 'directive',
      },
      {
        blankLine: 'always',
        next: '*',
        prev: ['case', 'default'],
      },
    ],
    'react/no-unknown-property': [
      'error',
      {
        ignore: ['vaul-drawer-wrapper'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
};
