import jest from 'eslint-plugin-jest';
import { TEST_FILES } from '../../lib/constants';
import jestRules from '../../rules/jest';

/** @type {import('eslint').Linter.Config} */
export default {
  ...jest.configs['flat/recommended'],
  files: TEST_FILES,
  rules: {
    ...jest.configs['flat/recommended'].rules,
    ...jestRules.rules,
  },
};
