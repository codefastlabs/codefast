import type { Linter } from 'eslint';

export const vitestRules: Linter.Config = {
  name: '@codefast/style-guide/rules/vitest',
  rules: {
    /**
     * Disallow duplicate setup and teardown hooks.
     *
     * 🚫 Not fixable - https://github.com/veritem/eslint-plugin-vitest/blob/HEAD/docs/rules/no-duplicate-hooks.md
     */
    'vitest/no-duplicate-hooks': 'error',

    /**
     * Require lowercase test names.
     *
     * 🔧 Fixable - https://github.com/veritem/eslint-plugin-vitest/blob/HEAD/docs/rules/prefer-lowercase-title.md
     */
    'vitest/prefer-lowercase-title': 'warn',
  },
};
