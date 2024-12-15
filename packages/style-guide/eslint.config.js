import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...recommendedConfig,
  {
    ignores: ['dist'],
  },
  {
    files: ['*.config.js'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
