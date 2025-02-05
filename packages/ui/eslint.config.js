import { config } from '@codefast/eslint-config/react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/tailwindcss/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'import/no-default-export': 'off',
    },
  },
];
