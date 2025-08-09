import type { Linter } from "eslint";

import pluginJest from "eslint-plugin-jest";

/**
 * Rules that are set to "warn" for Jest plugin
 * These rules are grouped together for better organization and maintainability
 * These rules highlight testing issues that should be addressed but don't break functionality
 */
const warningJestRules: Linter.RulesRecord = {
  /**
   * Reports commented-out test cases
   * Should be warned about but not fail the build
   */
  "jest/no-commented-out-tests": "warn",

  /**
   * Reports disabled test cases (skipped with .skip or x prefix)
   * Should be warned about but not fail the build
   */
  "jest/no-disabled-tests": "warn",

  /**
   * Reports large snapshots that might be hard to review
   * Configured to warn when snapshots exceed 300 lines
   */
  "jest/no-large-snapshots": ["warn", { maxSize: 300 }],
};

/**
 * Rules that are set to "error" for Jest plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical issues that must be fixed
 */
const errorJestRules: Linter.RulesRecord = {
  /**
   * Enforces consistent usage of test or it
   * Configured to prefer "test" function over "it"
   */
  "jest/consistent-test-it": ["error", { fn: "test" }],

  /**
   * Enforces that tests must contain at least one expect statement
   * Configured to recognize both expect and request.**.expect patterns
   */
  "jest/expect-expect": [
    "error",
    {
      assertFunctionNames: ["expect", "request.**.expect"],
    },
  ],

  /**
   * Enforces a maximum depth for nested describe blocks
   * Configured to allow up to 5 levels of nesting
   */
  "jest/max-nested-describe": ["error", { max: 5 }],

  /**
   * Disallows alias methods (toThrowError over toThrow)
   */
  "jest/no-alias-methods": "error",

  /**
   * Disallows expect statements in conditional blocks
   */
  "jest/no-conditional-expect": "error",

  /**
   * Disallows deprecated Jest functions
   */
  "jest/no-deprecated-functions": "error",

  /**
   * Disallows done callback in Jest tests
   */
  "jest/no-done-callback": "error",

  /**
   * Disallows duplicate hooks in Jest tests
   */
  "jest/no-duplicate-hooks": "error",

  /**
   * Disallows export from test files
   */
  "jest/no-export": "error",

  /**
   * Disallows focused tests (.only)
   */
  "jest/no-focused-tests": "error",

  /**
   * Disallows identical test titles
   */
  "jest/no-identical-title": "error",

  /**
   * Disallows string interpolation in snapshots
   */
  "jest/no-interpolation-in-snapshots": "error",

  /**
   * Disallows Jasmine globals
   */
  "jest/no-jasmine-globals": "error",

  /**
   * Disallows importing from __mocks__ directory
   */
  "jest/no-mocks-import": "error",

  /**
   * Disallows standalone expect statements outside of test blocks
   */
  "jest/no-standalone-expect": "error",

  /**
   * Disallows using test prefixes
   */
  "jest/no-test-prefixes": "error",

  /**
   * Disallows return statements in test functions
   */
  "jest/no-test-return-statement": "error",

  /**
   * Prefers using toHaveBeenCalledWith over toHaveBeenCalled
   */
  "jest/prefer-called-with": "error",

  /**
   * Prefers using comparison matchers
   */
  "jest/prefer-comparison-matcher": "error",

  /**
   * Prefers using equality matchers
   */
  "jest/prefer-equality-matcher": "error",

  /**
   * Prefers using expect.resolves over expect(await ...)
   */
  "jest/prefer-expect-resolves": "error",

  /**
   * Prefers having hooks at the top of describe blocks
   */
  "jest/prefer-hooks-on-top": "error",

  /**
   * Prefers lowercase test titles
   * Configured to ignore describe blocks
   */
  "jest/prefer-lowercase-title": ["error", { ignore: ["describe"] }],

  /**
   * Prefers using mock promise shorthand
   */
  "jest/prefer-mock-promise-shorthand": "error",

  /**
   * Prefers using snapshot hints
   */
  "jest/prefer-snapshot-hint": "error",

  /**
   * Prefers using jest.spyOn over manual mocking
   */
  "jest/prefer-spy-on": "error",

  /**
   * Prefers using toStrictEqual over toEqual
   */
  "jest/prefer-strict-equal": "error",

  /**
   * Prefers using toBe for primitive values
   */
  "jest/prefer-to-be": "error",

  /**
   * Prefers using toContain for array/string inclusion checks
   */
  "jest/prefer-to-contain": "error",

  /**
   * Prefers using toHaveLength for length checks
   */
  "jest/prefer-to-have-length": "error",

  /**
   * Prefers using test.todo for placeholder tests
   */
  "jest/prefer-todo": "error",

  /**
   * Requires a hook to be used
   */
  "jest/require-hook": "error",

  /**
   * Requires error messages when using toThrow matchers
   */
  "jest/require-to-throw-message": "error",

  /**
   * Requires tests to be inside a top-level describe block
   */
  "jest/require-top-level-describe": "error",

  /**
   * Enforces valid describe callback
   */
  "jest/valid-describe-callback": "error",

  /**
   * Enforces valid expect usage
   */
  "jest/valid-expect": "error",

  /**
   * Enforces valid expect in promise chains
   */
  "jest/valid-expect-in-promise": "error",

  /**
   * Enforces valid test titles
   */
  "jest/valid-title": "error",
};

export const jestRules: Linter.Config[] = [
  {
    files: [
      "**/*.test.{js,ts,tsx}",
      "**/*.spec.{js,ts,tsx}",
      "**/test/**/*.{js,ts,tsx}",
      "**/tests/**/*.{js,ts,tsx}",
      "**/__tests__/**/*.{js,ts,tsx}",
    ],
    plugins: {
      jest: pluginJest,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,

      // Apply all warning rules
      ...warningJestRules,

      // Apply all error rules
      ...errorJestRules,
    },
  },
];
