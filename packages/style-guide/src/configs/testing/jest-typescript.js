import { TYPESCRIPT_TEST_FILES } from '../../lib/constants.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  files: TYPESCRIPT_TEST_FILES,
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
};
