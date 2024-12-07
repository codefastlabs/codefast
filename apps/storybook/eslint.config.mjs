import { config } from '@codefast/eslint-config/next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      'import/no-cycle': 'off',
    },
  },
];
