import type { Linter } from 'eslint';

export const commentsRules: Linter.Config = {
  rules: {
    /**
     * Require comments on ESlint disable directives.
     *
     * 🚫 Not fixable - https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/require-description.html
     */
    '@eslint-community/eslint-comments/require-description': 'error',
  },
};
