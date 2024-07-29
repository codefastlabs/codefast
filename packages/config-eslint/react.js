const { resolve } = require('node:path');
const rules = require('./common');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/react'),
  ],
  globals: {
    JSX: true,
  },
  ignorePatterns: ['node_modules/', 'dist/', '*.config.*'],
  parserOptions: {
    project,
  },
  plugins: ['only-warn', 'typescript-sort-keys'],
  rules: {
    'react/jsx-pascal-case': [
      'warn',
      {
        allowNamespace: true,
      },
    ],
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        shorthandFirst: true,
        shorthandLast: false,
        ignoreCase: true,
        noSortAlphabetically: false,
        reservedFirst: true,
      },
    ],
    'react/no-unknown-property': [
      'warn',
      {
        ignore: ['cmdk-input-wrapper'],
      },
    ],
    ...rules,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
};
