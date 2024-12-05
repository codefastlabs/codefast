import globals from 'globals';

import { recommended } from './eslint/index.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['eslint/rules/**'],
    rules: {
      'sort-keys': 'error',
    },
  },
  {
    files: ['*.config.js'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
