const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type { import("eslint").Linter.Config } */
module.exports = {
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
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
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
};
