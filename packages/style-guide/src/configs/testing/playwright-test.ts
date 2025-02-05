import type { Linter } from 'eslint';

import playwrightPlugin from 'eslint-plugin-playwright';

import { playwrightTestRules } from '@/rules/playwright-test';

export const playwrightTestConfig: Linter.Config = {
  ...playwrightPlugin.configs['flat/recommended'],
  name: '@codefast/style-guide/configs/testing/playwright-test',
  rules: {
    ...playwrightPlugin.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
