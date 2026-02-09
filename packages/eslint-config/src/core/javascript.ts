import type { Linter } from 'eslint';

import js from '@eslint/js';

/**
 * Rules that are set to "warn" for JavaScript
 * These rules are grouped together for better organization and maintainability
 * These rules highlight issues that should be addressed but don't break functionality
 */
const warningJavaScriptRules: Linter.RulesRecord = {
  /**
   * Disallows magic numbers (numbers with no clear meaning in the code)
   * @see [no-magic-numbers](https://eslint.org/docs/rules/no-magic-numbers)
   */
  'no-magic-numbers': [
    'warn',
    {
      ignore: [0, 1, -1],
    },
  ],

  /**
   * Disallows unused variables, with an exception for variables starting with underscore
   * @see [no-unused-vars](https://eslint.org/docs/rules/no-unused-vars)
   */
  'no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
    },
  ],
};

/**
 * Rules that are set to "error" for JavaScript
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical issues that must be fixed
 */
const errorJavaScriptRules: Linter.RulesRecord = {
  /**
   * Requires returning statements to either always or never specify values
   * @see [consistent-return](https://eslint.org/docs/rules/consistent-return)
   */
  'consistent-return': 'error',

  /**
   * Enforces default clauses in switch statements to be last
   * @see [default-case-last](https://eslint.org/docs/rules/default-case-last)
   */
  'default-case-last': 'error',

  /**
   * Requires the use of === and !== instead of == and !=
   * @see [eqeqeq](https://eslint.org/docs/rules/eqeqeq)
   */
  eqeqeq: ['error', 'always'],

  /**
   * Disallows the use of alert, confirm, and prompt functions
   * @see [no-alert](https://eslint.org/docs/rules/no-alert)
   */
  'no-alert': 'error',

  /**
   * Disallows the use of debugger statements
   * @see [no-debugger](https://eslint.org/docs/rules/no-debugger)
   */
  'no-debugger': 'error',

  /**
   * Disallows unnecessary type conversions
   * @see [no-implicit-coercion](https://eslint.org/docs/rules/no-implicit-coercion)
   */
  'no-implicit-coercion': 'error',

  /**
   * Disallows nested ternary expressions
   * @see [no-nested-ternary](https://eslint.org/docs/rules/no-nested-ternary)
   */
  'no-nested-ternary': 'error',

  /**
   * Disallows ternary operators when simpler alternatives exist
   * @see [no-unneeded-ternary](https://eslint.org/docs/rules/no-unneeded-ternary)
   */
  'no-unneeded-ternary': 'error',

  /**
   * Disallows unnecessary string concatenation
   * @see [no-useless-concat](https://eslint.org/docs/rules/no-useless-concat)
   */
  'no-useless-concat': 'error',

  /**
   * Disallows renaming imports, exports, and destructured assignments to the same name
   * @see [no-useless-rename](https://eslint.org/docs/rules/no-useless-rename)
   */
  'no-useless-rename': 'error',

  /**
   * Disallows unnecessary return statements
   * @see [no-useless-return](https://eslint.org/docs/rules/no-useless-return)
   */
  'no-useless-return': 'error',

  /**
   * Requires let or const instead of var
   * @see [no-var](https://eslint.org/docs/rules/no-var)
   */
  'no-var': 'error',

  /**
   * Requires object literal shorthand syntax
   * @see [object-shorthand](https://eslint.org/docs/rules/object-shorthand)
   */
  'object-shorthand': 'error',

  /**
   * Requires using arrow functions for callbacks
   * @see [prefer-arrow-callback](https://eslint.org/docs/rules/prefer-arrow-callback)
   */
  'prefer-arrow-callback': 'error',

  /**
   * Requires const declarations for variables that are never reassigned
   * @see [prefer-const](https://eslint.org/docs/rules/prefer-const)
   */
  'prefer-const': 'error',

  /**
   * Requires destructuring from arrays and/or objects
   * @see [prefer-destructuring](https://eslint.org/docs/rules/prefer-destructuring)
   */
  'prefer-destructuring': [
    'error',
    {
      array: false,
      object: true,
    },
  ],

  /**
   * Disallows Math.pow in favor of the ** operator
   * @see [prefer-exponentiation-operator](https://eslint.org/docs/rules/prefer-exponentiation-operator)
   */
  'prefer-exponentiation-operator': 'error',

  /**
   * Requires use of binary and octal literals instead of parseInt()
   * @see [prefer-numeric-literals](https://eslint.org/docs/rules/prefer-numeric-literals)
   */
  'prefer-numeric-literals': 'error',

  /**
   * Requires use of object spread instead of Object.assign
   * @see [prefer-object-spread](https://eslint.org/docs/rules/prefer-object-spread)
   */
  'prefer-object-spread': 'error',

  /**
   * Requires rest parameters instead of arguments
   * @see [prefer-rest-params](https://eslint.org/docs/rules/prefer-rest-params)
   */
  'prefer-rest-params': 'error',

  /**
   * Requires spread operators instead of .apply()
   * @see [prefer-spread](https://eslint.org/docs/rules/prefer-spread)
   */
  'prefer-spread': 'error',

  /**
   * Requires template literals instead of string concatenation
   * @see [prefer-template](https://eslint.org/docs/rules/prefer-template)
   */
  'prefer-template': 'error',

  /**
   * Enforces the consistent use of the radix argument when using parseInt()
   * @see [radix](https://eslint.org/docs/rules/radix)
   */
  radix: 'error',

  /**
   * Disallows Yoda conditions (where the literal is placed first in a comparison)
   * @see [yoda](https://eslint.org/docs/rules/yoda)
   */
  yoda: 'error',
};

export const baseJavaScriptRules: Linter.Config[] = [
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/coverage/**', '**/.cursor/**', '**/.agent/**'],
    name: '@codefast/eslint-config/core/javascript/ignores',
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    name: '@codefast/eslint-config/core/javascript/recommended',
    plugins: {
      js,
    },
    rules: {
      ...js.configs.recommended.rules,

      // Apply all warning rules
      ...warningJavaScriptRules,

      // Apply all error rules
      ...errorJavaScriptRules,
    },
  },
];
