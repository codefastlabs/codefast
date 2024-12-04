import playwright from 'eslint-plugin-playwright';
import playwrightTestRules from '../../rules/playwright-test';

/** @type {import('eslint').Linter} */
export default {
  ...playwright.configs['flat/recommended'],
  rules: {
    ...playwright.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
