import globals from 'globals';
import flat from './src/index.js';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...flat.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['eslint/rules/**'],
    rules: {
      'sort-keys': 'error',
    },
  },
  {
    files: ['*.config.js'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];

export { config as default };
