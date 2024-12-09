import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  'sort-keys': 'off',
};

export const perfectionistRules: Linter.Config = {
  rules: {
    ...disabledRules,

    'perfectionist/sort-enums': 'warn',

    'perfectionist/sort-objects': 'warn',
  },
};
