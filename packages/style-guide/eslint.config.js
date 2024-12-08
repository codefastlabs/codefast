import onlyWarn from 'eslint-plugin-only-warn';

import { recommendedConfig } from './dist/index.js';

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
