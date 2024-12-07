import vitestPlugin from '@vitest/eslint-plugin';

import { vitestRules } from '../../rules/vitest.js';

/** @type {import('eslint').Linter.Config} */
export const vitest = {
  plugins: {
    vitest: vitestPlugin,
  },
  rules: {
    ...vitestPlugin.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
