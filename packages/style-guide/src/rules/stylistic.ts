import type { Linter } from 'eslint';

export const stylisticRules: Linter.Config = {
  name: '@codefast/style-guide/rules/stylistic',
  rules: {
    /**
     * Disallow the omission of parentheses when invoking a constructor with
     * no arguments.
     *
     * 🔧 Fixable - https://eslint.style/rules/js/new-parens
     */
    '@stylistic/new-parens': 'warn',

    /**
     * Enforces consistent blank lines between statements
     *
     * 🔧 Fixable - https://eslint.style/rules/js/padding-line-between-statements
     */
    '@stylistic/padding-line-between-statements': [
      'warn',
      { blankLine: 'always', next: 'return', prev: '*' },
      { blankLine: 'always', next: '*', prev: ['const', 'let', 'var'] },
      { blankLine: 'any', next: ['const', 'let', 'var'], prev: ['const', 'let', 'var'] },
      { blankLine: 'always', next: '*', prev: 'block-like' },
      { blankLine: 'always', next: 'block-like', prev: '*' },
      { blankLine: 'always', next: '*', prev: 'directive' },
      { blankLine: 'any', next: 'directive', prev: 'directive' },
      { blankLine: 'always', next: '*', prev: ['case', 'default'] },
    ],
  },
};
