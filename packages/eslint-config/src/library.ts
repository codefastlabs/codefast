import type { Linter } from "eslint";

import { recommendedConfig } from "@codefast/style-guide/configs/core/recommended";
import { typescriptConfig } from "@codefast/style-guide/configs/core/typescript";
import { jestConfig } from "@codefast/style-guide/configs/testing/jest";
import { jestTypescriptConfig } from "@codefast/style-guide/configs/testing/jest-typescript";
import { testingLibraryConfig } from "@codefast/style-guide/configs/testing/testing-library";
import { prettierConfig } from "@codefast/style-guide/configs/utils/prettier";
import globals from "globals";

import { typescriptRules } from "@/rules/typescript";

/**
 * ESLint configuration for library projects.
 * Combines various rule sets and configurations for TypeScript and testing frameworks
 * into a comprehensive linting setup for library development.
 */
export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,

  /**
   * Configuration for Jest testing files.
   * Applies jest-specific globals to test files.
   */
  {
    ...jestConfig,
    files: ["**/?(*.)+(test|spec).[jt]s?(x)"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    name: "@codefast/eslint-config/library/jest",
  },

  /**
   * TypeScript-specific Jest configuration.
   * Extends standard Jest config with TypeScript-specific rules.
   */
  {
    ...jestTypescriptConfig,
    files: ["**/?(*.)+(test|spec).[jt]s?(x)"],
    name: "@codefast/eslint-config/library/jest/typescript",
  },

  /**
   * Testing Library-specific configuration.
   * Applies rules for React Testing Library and related testing utilities.
   */
  {
    ...testingLibraryConfig,
    files: ["**/?(*.)+(test|spec).[jt]s?(x)"],
    name: "@codefast/eslint-config/library/testing-library",
  },

  /**
   * TSDoc configuration for test files.
   * Disables TSDoc syntax validation in test files.
   */
  {
    files: ["**/?(*.)+(test|spec).[jt]s?(x)"],
    name: "@codefast/eslint-config/library/tsdoc",
    rules: {
      /**
       * Disables TSDoc syntax validation in test files.
       * Test files typically don't require the same level of documentation as production code.
       *
       * 🚫 Not fixable - https://tsdoc.org/
       */
      "tsdoc/syntax": "off",
    },
  },

  /**
   * Ignore patterns for build artifacts and coverage reports.
   * Prevents ESLint from linting generated files.
   */
  {
    ignores: ["dist/", "build/", "coverage/"],
    name: "@codefast/eslint-config/library/ignores",
  },

  /**
   * Language features configuration.
   * Sets ECMAScript version and includes browser and service worker globals.
   */
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    name: "@codefast/eslint-config/library/languages",
  },

  /**
   * TypeScript-specific rules configuration.
   * Applies TypeScript rules to all TypeScript files.
   *
   */
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    name: "@codefast/eslint-config/library/typescript",
    rules: {
      ...typescriptRules.rules,
    },
  },

  /**
   * Configuration files specific rules.
   * Relaxes TypeScript safety rules for configuration files.
   *
   */
  {
    files: ["**/*.config.{js,cjs,mjs,ts,cts,mts}"],
    name: "@codefast/eslint-config/library/configs",
    rules: {
      /**
       * Allows potentially unsafe assignments in configuration files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-assignment
       */
      "@typescript-eslint/no-unsafe-assignment": "off",

      /**
       * Allows calling of any typed values in configuration files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-call
       */
      "@typescript-eslint/no-unsafe-call": "off",

      /**
       * Allows accessing properties of values with type any in configuration files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-member-access
       */
      "@typescript-eslint/no-unsafe-member-access": "off",

      /**
       * Allows returning any typed values from functions in configuration files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-return
       */
      "@typescript-eslint/no-unsafe-return": "off",

      /**
       * Allows default exports in configuration files.
       *
       * 🚫 Not fixable - https://eslint.org/docs/rules/import/no-default-export
       */
      "import/no-default-export": "off",
    },
  },

  prettierConfig,
];
