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
];
