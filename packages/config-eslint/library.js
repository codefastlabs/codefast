const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type { import("eslint").Linter.Config } */
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('./rules/common'),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  ignorePatterns: ['node_modules/', 'dist/', '*.js', '*.mjs', '*.cjs'],
  parserOptions: {
    project,
  },
  plugins: ['only-warn', 'typescript-sort-keys'],
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
};
