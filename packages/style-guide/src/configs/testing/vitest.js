import vitest from '@vitest/eslint-plugin';

import { config as vitestRules } from '../../rules/vitest.js';
import { UNIT_TEST_FILES } from '../../lib/constants.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  files: UNIT_TEST_FILES,
  plugins: {
    vitest,
  },
  rules: {
    ...vitest.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
