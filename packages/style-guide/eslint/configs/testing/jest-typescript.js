/** @type {import('eslint').Linter.Config} */
export const jestTypescriptConfig = {
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
};
