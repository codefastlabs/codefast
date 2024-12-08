import jestPlugin from 'eslint-plugin-jest';

import { jestRules } from '../../rules/jest.js';

/** @type {import('eslint').Linter.Config} */
export const jestConfig = {
  ...jestPlugin.configs['flat/recommended'],
  rules: {
    ...jestPlugin.configs['flat/recommended'].rules,
    ...jestRules.rules,
  },
};
