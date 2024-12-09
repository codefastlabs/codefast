import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {};

export const perfectionistRules: Linter.Config = {
  rules: {
    ...disabledRules,
  },
};
