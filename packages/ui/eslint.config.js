import { config } from '@codefast/eslint-config/react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['*.config.js'],
  },
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/tailwindcss/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
];
