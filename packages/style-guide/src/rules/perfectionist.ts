import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  'sort-keys': 'off',
};

export const perfectionistRules: Linter.Config = {
  rules: {
    ...disabledRules,

    'perfectionist/sort-enums': [
      'warn',
      {
        type: 'natural',
      },
    ],

    'perfectionist/sort-objects': [
      'warn',
      {
        type: 'natural',
      },
    ],
  },
};
