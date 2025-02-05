import { config } from '@codefast/eslint-config/library';

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
