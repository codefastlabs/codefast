import type { Linter } from 'eslint';

export const jestTypescriptConfig: Linter.Config = {
  name: 'jest-typescript',
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
};
