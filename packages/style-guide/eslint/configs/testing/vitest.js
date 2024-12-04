import vitest from '@vitest/eslint-plugin';

import { config as vitestRules } from '../../rules/vitest.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  plugins: {
    vitest,
  },
  rules: {
    ...vitest.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
