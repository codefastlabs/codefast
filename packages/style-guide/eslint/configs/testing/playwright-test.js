import playwright from 'eslint-plugin-playwright';

import { config as playwrightTestRules } from '../../rules/playwright-test.js';
import { E2E_TEST_FILES } from '../../lib/constants.js';

/** @type {import('eslint').Linter} */
export const config = {
  ...playwright.configs['flat/recommended'],
  files: E2E_TEST_FILES,
  rules: {
    ...playwright.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
