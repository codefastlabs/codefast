/** @type {import('eslint').Linter.Config} */
export const jestTypescript = {
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
};
