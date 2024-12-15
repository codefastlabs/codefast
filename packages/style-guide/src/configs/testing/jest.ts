import jestPlugin from 'eslint-plugin-jest';
import type { Linter } from 'eslint';

import { jestRules } from '@/rules/jest';

export const jestConfig: Linter.Config = {
  ...jestPlugin.configs['flat/recommended'],
  rules: {
    ...jestPlugin.configs['flat/recommended'].rules,
    ...jestRules.rules,
  },
};
