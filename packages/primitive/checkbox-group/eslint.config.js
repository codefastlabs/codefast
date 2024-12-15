import { config } from '@codefast/eslint-config/react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['dist', '*.config.js'],
  },
];
