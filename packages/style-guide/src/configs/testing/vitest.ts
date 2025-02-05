import type { Linter } from 'eslint';

import vitestPlugin from '@vitest/eslint-plugin';

import { vitestRules } from '@/rules/vitest';

export const vitestConfig: Linter.Config = {
  ...vitestPlugin.configs.recommended,
  name: '@codefast/style-guide/configs/testing/vitest',
  rules: {
    ...vitestPlugin.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
