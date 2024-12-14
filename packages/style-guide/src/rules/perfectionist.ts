import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  /**
   * Disabled for `sort-objects` rule
   */
  'sort-keys': 'off',

  /**
   * Disabled for `sort-interfaces` rule.
   */
  '@typescript-eslint/adjacent-overload-signatures': 'off',
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
        groups: ['top', ['multiline', 'method', 'unknown'], 'bottom'],
        customGroups: {
          top: ['^id$', '^__'],
          bottom: ['At$', '_at$'],
        },
      },
    ],

    /**
     * Enforce sorted TypeScript interface properties.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-interfaces
     */
    'perfectionist/sort-interfaces': [
      'error',
      {
        type: 'natural',
        groups: ['required-member', 'optional-member'],
      },
    ],
  },
};
