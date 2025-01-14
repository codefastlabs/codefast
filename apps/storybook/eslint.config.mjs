import { config } from '@codefast/eslint-config/next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    files: ['**/*.stories.@(js|jsx|ts|tsx)'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
