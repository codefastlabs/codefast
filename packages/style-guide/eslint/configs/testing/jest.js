import jest from 'eslint-plugin-jest';

import { config as jestRules } from '../../rules/jest.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  ...jest.configs['flat/recommended'],
  rules: {
    ...jest.configs['flat/recommended'].rules,
    ...jestRules.rules,
  },
};