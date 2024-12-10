import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  'sort-keys': 'off',
};

export const perfectionistRules: Linter.Config = {
  rules: {
    ...disabledRules,

    /**
     * Enforce sorted TypeScript enum members.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-enums
     */
    'perfectionist/sort-enums': [
      'warn',
      {
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted objects.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-objects
     */
    'perfectionist/sort-objects': [
      'warn',
      {
        type: 'natural',
        groups: ['top', 'middle', ['multiline', 'method', 'unknown'], 'bottom'],
        customGroups: {
          top: ['^id$', '^__'],
          middle: ['Id$', '_id$'],
          bottom: ['At$', '_at$'],
        },
      },
    ],
  },
};
