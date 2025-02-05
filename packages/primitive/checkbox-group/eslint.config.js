import { config } from '@codefast/eslint-config/react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['**/node_modules/', 'dist/', 'build/', '*.config.js'],
  },
];
