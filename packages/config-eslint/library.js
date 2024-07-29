const { resolve } = require('node:path');
const rules = require('./common');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  ignorePatterns: ['node_modules/', 'dist/'],
  parserOptions: {
    project,
  },
  plugins: ['only-warn', 'typescript-sort-keys'],
  rules: {
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
