import type { Linter } from "eslint";

import pluginUnicorn from "eslint-plugin-unicorn";

/**
 * Rules that are disabled (set to "off") for unicorn plugin
 * These rules are grouped together for better organization and maintainability
 */
const disabledUnicornRules: Linter.RulesRecord = {
  /**
   * Disallow Array#reduce() and Array#reduceRight().
   *
   * Disabled because reduce() is a useful and commonly used array method
   * that can make code more concise and functional in many cases.
   */
  "unicorn/no-array-reduce": "off",

  /**
   * Disallow the use of the null literal.
   *
   * Disabled because null is a valid JavaScript value that has specific
   * use cases and semantic meaning different from undefined.
   */
  "unicorn/no-null": "off",

  /**
   * Disallow process.exit().
   *
   * Disabled because process.exit() is sometimes necessary in Node.js
   * applications for proper error handling and cleanup.
   */
  "unicorn/no-process-exit": "off",

  /**
   * Prefer JavaScript modules (ESM) over CommonJS.
   *
   * Disabled because the project may need to support both module systems
   * for compatibility reasons.
   */
  "unicorn/prefer-module": "off",

  /**
   * Prefer top-level await over immediately invoked async function expressions.
   *
   * Disabled because top-level await is not supported in all environments
   * and may cause compatibility issues.
   */
  "unicorn/prefer-top-level-await": "off",
};

/**
 * Rules that are set to "error" for unicorn plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical issues that must be fixed
 */
const errorUnicornRules: Linter.RulesRecord = {
  /**
   * Enforce a case style for filenames.
   *
   * Allows camelCase, kebab-case, and PascalCase for flexibility
   * across different naming conventions used in the project.
   */
  "unicorn/filename-case": [
    "error",
    {
      cases: {
        camelCase: true,
        kebabCase: true,
        pascalCase: true,
      },
    },
  ],

  /**
   * Prefer Array#flatMap() over Array#map().flat().
   *
   * Enforces the use of the more efficient and readable flatMap() method
   * instead of chaining map() and flat().
   */
  "unicorn/prefer-array-flat-map": "error",

  /**
   * Prefer Array#some() over Array#find() when checking for existence.
   *
   * Enforces using some() for boolean checks instead of find() which
   * is more semantically correct and potentially more performant.
   */
  "unicorn/prefer-array-some": "error",

  /**
   * Prefer Date.now() over new Date().getTime().
   *
   * Enforces the more concise and readable Date.now() method for
   * getting the current timestamp.
   */
  "unicorn/prefer-date-now": "error",

  /**
   * Prefer default parameters over reassignment.
   *
   * Enforces using ES6 default parameters instead of manually checking
   * for undefined and reassigning values.
   */
  "unicorn/prefer-default-parameters": "error",

  /**
   * Prefer Array#includes() over Array#indexOf() when checking for existence.
   *
   * Enforces the more readable and semantically correct includes() method
   * instead of checking indexOf() !== -1.
   */
  "unicorn/prefer-includes": "error",

  /**
   * Prefer Math.trunc() over bitwise operators for truncation.
   *
   * Enforces using the more readable and explicit Math.trunc() method
   * instead of bitwise operations like ~~x or x | 0.
   */
  "unicorn/prefer-math-trunc": "error",

  /**
   * Prefer modern Math APIs over legacy alternatives.
   *
   * Enforces using newer Math methods like Math.sign(), Math.trunc(),
   * and Math.cbrt() over manual implementations.
   */
  "unicorn/prefer-modern-math-apis": "error",

  /**
   * Prefer using the node: protocol when importing Node.js builtin modules.
   *
   * Enforces explicit node: protocol imports (e.g., 'node:fs' instead of 'fs')
   * for better clarity and future compatibility.
   */
  "unicorn/prefer-node-protocol": "error",

  /**
   * Prefer Number static properties over global ones.
   *
   * Enforces using Number.parseInt(), Number.parseFloat(), Number.isNaN(),
   * and Number.isFinite() instead of their global counterparts.
   */
  "unicorn/prefer-number-properties": "error",

  /**
   * Prefer omitting the catch binding parameter when not used.
   *
   * Enforces optional catch binding syntax (catch \{ \} instead of catch (error) \{ \})
   * when the error parameter is not used.
   */
  "unicorn/prefer-optional-catch-binding": "error",

  /**
   * Prefer String#slice() over String#substr() and String#substring().
   *
   * Enforces using the more consistent and predictable slice() method
   * instead of the deprecated substr() or confusing substring().
   */
  "unicorn/prefer-string-slice": "error",

  /**
   * Prefer String#startsWith() and String#endsWith() over regex and indexOf().
   *
   * Enforces using the more readable and performant startsWith() and
   * endsWith() methods instead of regex or indexOf() checks.
   */
  "unicorn/prefer-string-starts-ends-with": "error",

  /**
   * Prefer String#trimStart() and String#trimEnd() over String#trimLeft() and String#trimRight().
   *
   * Enforces using the standardized trimStart() and trimEnd() methods
   * instead of the deprecated trimLeft() and trimRight() aliases.
   */
  "unicorn/prefer-string-trim-start-end": "error",

  /**
   * Prefer ternary expressions over simple if-else statements.
   *
   * Enforces using ternary operators for simple conditional assignments
   * and returns to make code more concise and functional.
   */
  "unicorn/prefer-ternary": "error",

  /**
   * Prevent abbreviations in variable names, function names, and filenames.
   *
   * Enforces descriptive naming by preventing common abbreviations.
   * Configured to allow common abbreviations that are widely accepted
   * in the React/JavaScript ecosystem for practicality and readability.
   */
  "unicorn/prevent-abbreviations": [
    "error",
    {
      checkFilenames: false,
      replacements: {
        args: false,
        ctx: false,
        dev: false,
        dist: false,
        env: false,
        lib: false,
        params: false,
        pkg: false,
        prod: false,
        props: false,
        ref: false,
        req: false,
        res: false,
        src: false,
      },
    },
  ],

  /**
   * Prefer export...from over import then export.
   *
   * Enforces using 'export \{ foo \} from "module"' instead of
   * 'import \{ foo \} from "module"; export \{ foo \};' for cleaner re-exports.
   */
  "unicorn/prefer-export-from": "error",

  /**
   * Require new when throwing an error.
   *
   * Enforces using 'new Error()' instead of 'Error()' when throwing errors
   * for consistency and to make error creation explicit.
   */
  "unicorn/throw-new-error": "error",
};

/**
 * ESLint configuration for unicorn plugin rules.
 *
 * This configuration includes various code quality and modern JavaScript/TypeScript
 * best practices rules from the eslint-plugin-unicorn package.
 */
export const unicornRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      unicorn: pluginUnicorn,
    },
    rules: {
      ...pluginUnicorn.configs.recommended.rules,

      // Apply all disabled rules
      ...disabledUnicornRules,

      // Apply all error rules
      ...errorUnicornRules,
    },
  },
];
