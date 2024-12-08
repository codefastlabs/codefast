import vitestPlugin from '@vitest/eslint-plugin';
import { type Linter } from 'eslint';

import { vitestRules } from '@/rules/vitest';

/** @type {import('eslint').Linter.Config} */
export const vitestConfig: Linter.Config = {
  plugins: {
    vitest: vitestPlugin,
  },
  rules: {
    ...vitestPlugin.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
