import playwrightPlugin from 'eslint-plugin-playwright';

import { playwrightTestRules } from '../../rules/playwright-test.js';

/** @type {import('eslint').Linter} */
export const playwrightTest = {
  ...playwrightPlugin.configs['flat/recommended'],
  rules: {
    ...playwrightPlugin.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
