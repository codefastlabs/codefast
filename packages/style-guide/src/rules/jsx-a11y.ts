import type { Linter } from 'eslint';

/**
 * These are enabled by `jsx-a11y/recommended`, but we've made the decision to
 * disable them.
 */
const disabledRules: Partial<Linter.RulesRecord> = {
  // This rule has been deprecated but not yet removed.
  'jsx-a11y/no-onchange': 'off',
};

export const jsxA11yRules: Linter.Config = {
  name: '@codefast/style-guide/rules/jsx-a11y',
  rules: {
    ...disabledRules,
  },
};
