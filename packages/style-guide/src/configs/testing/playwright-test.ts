import type { Linter } from 'eslint';

import playwrightPlugin from 'eslint-plugin-playwright';

import { playwrightTestRules } from '@/rules/playwright-test';

export const playwrightTestConfig: Linter.Config = {
  name: 'playwright',
  ...playwrightPlugin.configs['flat/recommended'],
  rules: {
    ...playwrightPlugin.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
