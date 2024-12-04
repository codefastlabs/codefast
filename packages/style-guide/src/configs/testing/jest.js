import jest from 'eslint-plugin-jest';
import { UNIT_TEST_FILES } from '../../lib/constants.js';
import jestRules from '../../rules/jest.js';

/** @type {import('eslint').Linter.Config} */
const config = {
  ...jest.configs['flat/recommended'],
  files: UNIT_TEST_FILES,
  rules: {
    ...jest.configs['flat/recommended'].rules,
    ...jestRules.rules,
  },
};

export { config as default };
