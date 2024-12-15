import { config } from '@codefast/eslint-config/library';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['*.config.js'],
  },
  {
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
];
