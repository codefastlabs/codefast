import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

import { jsxA11yRules } from '../../rules/jsx-a11y.js';

/** @type {import('eslint').Linter.Config} */
export const jsxA11yConfig = {
  ...jsxA11yPlugin.flatConfigs.recommended,
  rules: {
    ...jsxA11yPlugin.flatConfigs.recommended.rules,
    ...jsxA11yRules.rules,
  },
};
