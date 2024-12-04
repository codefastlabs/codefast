/** @type {import('eslint').Linter.Config} */
export const config = {
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
};
