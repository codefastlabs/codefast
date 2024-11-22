const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type { import('eslint').Linter.Config } */
module.exports = {
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
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
    },
    {
      extends: [require.resolve('@vercel/style-guide/eslint/playwright-test')],
      files: ['**/e2e/**/*.[jt]s?(x)', '**/?(*.)+(spec|e2e).[jt]s?(x)'],
    },
  ],
  parserOptions: {
    project,
  },
  rules: {
    /** Warns when JSX components aren't in PascalCase but allows namespaces */
    'react/jsx-pascal-case': [
      'warn',
      {
        allowNamespace: true,
      },
    ],

    /** Enforces sorting of JSX props */
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
        ignore: ['cmdk-input-wrapper'],
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
