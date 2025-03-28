import type { Linter } from 'eslint';

export const jestRules: Linter.Config = {
  name: '@codefast/style-guide/rules/jest',
  rules: {
    /**
     * Disallow duplicate setup and teardown hooks.
     *
     * 🚫 Not fixable - https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-duplicate-hooks.md
     */
    'jest/no-duplicate-hooks': 'error',

    /**
     * Require lowercase test names.
     *
     * 🔧 Fixable - https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/prefer-lowercase-title.md
     */
    'jest/prefer-lowercase-title': 'warn',
  },
};
