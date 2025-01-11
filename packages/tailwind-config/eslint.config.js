import { config } from '@codefast/eslint-config/library';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['*.config.js'],
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
];
