import playwright from 'eslint-plugin-playwright';

import { playwrightTestRules } from '../../rules/playwright-test.js';

/** @type {import('eslint').Linter} */
export const config = {
  ...playwright.configs['flat/recommended'],
  rules: {
    ...playwright.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
