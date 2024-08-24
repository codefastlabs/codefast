const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('./rules/common'),
  ],
  globals: { JSX: true },
  ignorePatterns: ['node_modules/', 'dist/', '*.js', '*.mjs', '*.cjs'],
  parserOptions: { project },
  plugins: ['only-warn', 'typescript-sort-keys'],
  rules: {
    'react/jsx-pascal-case': ['warn', { allowNamespace: true }],
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
    'react/no-unknown-property': ['warn', { ignore: ['cmdk-input-wrapper'] }],
  },
  settings: { 'import/resolver': { typescript: { project } } },
};
