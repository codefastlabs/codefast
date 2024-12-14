import { recommendedConfig } from '@codefast/style-guide/configs/core/recommended';
import onlyWarn from 'eslint-plugin-only-warn';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...recommendedConfig,
  {
    plugins: {
      'only-warn': onlyWarn,
    },
  },
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
