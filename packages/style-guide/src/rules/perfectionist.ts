import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  /**
   * Disabled for `sort-interfaces`, `sort-object-types` rules.
   */
  '@typescript-eslint/adjacent-overload-signatures': 'off',

  /**
   * Disabled for `sort-intersection-types`, `sort-union-types` rule.
   */
  '@typescript-eslint/sort-type-constituents': 'off',

  /**
   * Disabled for `sort-imports` rule
   */
  'import/order': 'off',

  /**
   * Disabled for `sort-imports` rule
   */
  'sort-imports': 'off',

  /**
   * Disabled for `sort-objects` rule
   */
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
     * Enforce sorted exports.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-exports
     */
    'perfectionist/sort-exports': [
      'warn',
      {
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted imports.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-imports
     */
    'perfectionist/sort-imports': [
      'warn',
      {
        internalPattern: ['^@/.+', '^~/.+'],
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted TypeScript interface properties.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-interfaces
     */
    'perfectionist/sort-interfaces': [
      'warn',
      {
        groups: ['required-member', 'optional-member'],
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted intersection types in TypeScript.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-intersection-types
     */
    'perfectionist/sort-intersection-types': [
      'warn',
      {
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted named exports.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-named-exports
     */
    'perfectionist/sort-named-exports': [
      'warn',
      {
        groupKind: 'values-first',
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted named imports.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-named-imports
     */
    'perfectionist/sort-named-imports': [
      'warn',
      {
        groupKind: 'types-first',
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted object types.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-object-types
     */
    'perfectionist/sort-object-types': [
      'warn',
      {
        groups: ['required-member', 'optional-member'],
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
        customGroups: {
          bottom: ['At$', '_at$'],
          top: ['^id$', '^__'],
        },
        groups: ['top', ['multiline', 'method', 'unknown'], 'bottom'],
        type: 'natural',
      },
    ],

    /**
     * Enforce sorted TypeScript union types.
     *
     * 🔧 Fixable - https://perfectionist.dev/rules/sort-union-types
     */
    'perfectionist/sort-union-types': [
      'warn',
      {
        type: 'natural',
      },
    ],
  },
};
