import playwrightPlugin from 'eslint-plugin-playwright';
import { type Linter } from 'eslint';

import { playwrightTestRules } from '@/rules/playwright-test';

export const playwrightTestConfig: Linter.Config = {
  ...playwrightPlugin.configs['flat/recommended'],
  rules: {
    ...playwrightPlugin.configs['flat/recommended'].rules,
    ...playwrightTestRules.rules,
  },
};
