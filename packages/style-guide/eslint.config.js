import globals from 'globals';

import { config } from './src/index.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config.configs.recommended,
  {
    ignores: ['dist/', '.turbo/', 'node_modules/'],
  },
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
