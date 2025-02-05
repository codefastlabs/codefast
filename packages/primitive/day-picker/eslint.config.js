import { config } from '@codefast/eslint-config/react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    files: ['*.config.*'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
