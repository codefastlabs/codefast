import next from '@next/eslint-plugin-next';
import babelOptions from '../../lib/babel-options.js';
import { JAVASCRIPT_FILES } from '../../lib/constants.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    plugins: {
      '@next/next': next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
    languageOptions: {
      parserOptions: {
        babelOptions,
      },
    },
    ignores: ['**/.next/**'],
  },
  {
    files: JAVASCRIPT_FILES,
    languageOptions: {
      parserOptions: {
        babelOptions,
      },
    },
  },
];
