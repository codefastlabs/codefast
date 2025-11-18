import type { Linter } from 'eslint';

import css from '@eslint/css';

export const cssRules: Linter.Config[] = [
  {
    files: ['**/*.css'],
    language: 'css/css',
    name: '@codefast/eslint-config/language/css',
    plugins: { css },
    rules: {
      ...css.configs.recommended.rules,
    },
  },
];
