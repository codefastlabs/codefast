import { TYPESCRIPT_TEST_FILES } from '../../lib/constants';

/** @type {import('eslint').Linter.Config} */
export default {
  files: TYPESCRIPT_TEST_FILES,
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
};
