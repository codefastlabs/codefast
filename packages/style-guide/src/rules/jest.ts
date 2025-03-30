import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  /**
   * Disables checking if anchors have valid href attributes.
   *
   * 🚫 Not fixable - https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/anchor-is-valid.md
   */
  'jsx-a11y/anchor-is-valid': 'off',
};

export const jestRules: Linter.Config = {
  name: '@codefast/style-guide/rules/jest',
  rules: {
    ...disabledRules,

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
    'jest/prefer-lowercase-title': ['warn', { ignore: ['describe'] }],
  },
};
