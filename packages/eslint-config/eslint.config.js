import { config } from './dist/library.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['*.config.js'],
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'import/no-cycle': 'off',
    },
  },
];
