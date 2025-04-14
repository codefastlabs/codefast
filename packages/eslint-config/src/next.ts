import type { Linter } from "eslint";

import { recommendedConfig } from "@codefast/style-guide/core/recommended";
import { typescriptConfig } from "@codefast/style-guide/core/typescript";
import { nextConfig } from "@codefast/style-guide/frameworks/next";
import { reactConfig } from "@codefast/style-guide/frameworks/react";
import { jestConfig } from "@codefast/style-guide/testing/jest";
import { jestTypescriptConfig } from "@codefast/style-guide/testing/jest-typescript";
import { playwrightTestConfig } from "@codefast/style-guide/testing/playwright-test";
import { testingLibraryConfig } from "@codefast/style-guide/testing/testing-library";
import { prettierConfig } from "@codefast/style-guide/utils/prettier";
import globals from "globals";

import { typescriptRules } from "@/rules/typescript";

/**
 * ESLint configuration for Next.js projects.
 * Combines various rule sets and configurations for TypeScript, React, Next.js,
 * and testing frameworks into a comprehensive linting setup.
 */
export const config: Linter.Config[] = [
  ...recommendedConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...nextConfig,

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
   * Disables TSDoc syntax validation in test and E2E files.
   */
  {
    files: ["**/?(*.)+(test|spec|e2e).[jt]s?(x)"],
    name: "@codefast/eslint-config/next/tsdoc",
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
   * Playwright E2E testing configuration.
   * Applies Playwright-specific rules to E2E test files.
   */
  {
    ...playwrightTestConfig,
    files: ["**/?(*.)+(e2e).[jt]s?(x)"],
    name: "@codefast/eslint-config/next/playwright",
  },

  /**
   * Ignore patterns for build artifacts and generated directories.
   * Prevents ESLint from linting generated files and build outputs.
   */
  {
    ignores: ["dist/", "build/", ".next/", ".contentlayer/", "coverage/"],
    name: "@codefast/eslint-config/next/ignores",
  },

  /**
   * Language features configuration.
   * Sets ECMAScript version and includes service worker, Node.js, and browser globals.
   */
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.serviceworker,
        ...globals.node,
        ...globals.browser,
      },
    },
    name: "@codefast/eslint-config/next/languages",
  },

  /**
   * TypeScript-specific rules configuration.
   * Applies TypeScript rules to all TypeScript files with Next.js specific overrides.
   */
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    name: "@codefast/eslint-config/next/typescript",
    rules: {
      ...typescriptRules.rules,

      /**
       * Prevents false positives for promises in JSX attributes that don't return values.
       * Particularly helpful for event handlers in Next.js components.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-misused-promises
       */
      "@typescript-eslint/no-misused-promises": ["warn", { checksVoidReturn: { attributes: false } }],
    },
  },

  {
    /**
     * Next.js-specific rules configuration.
     * Applies custom rules for Next.js projects.
     */
    name: "@codefast/eslint-config/next/rules",
    rules: {
      /**
       * Warns when using unknown DOM properties but ignores specified custom elements
       *
       * 🔧 Fixable -
       * https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
       */
      "react/no-unknown-property": ["warn", { ignore: ["vaul-drawer-wrapper"] }],
    },
  },

  /**
   * Next.js file naming conventions configuration.
   * Disables default export restrictions for Next.js special files.
   */
  {
    files: [
      "**/{default,error,forbidden,global-error,instrumentation,layout,loading,mdx-components,middleware,not-found,page,route,template,unauthorized}.{js,jsx,ts,tsx}",
    ],
    name: "@codefast/eslint-config/next/file-conventions",
    rules: {
      /**
       * Allows default exports in Next.js page and special files.
       * Required for Next.js page routing conventions.
       *
       * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
       */
      "import/no-default-export": "off",
    },
  },

  /**
   * Configuration files specific rules.
   * Relaxes certain TypeScript and import rules for configuration files.
   */
  {
    files: ["**/*.config.{js,cjs,mjs,ts,cts,mts}"],
    name: "@codefast/eslint-config/next/configs",
    rules: {
      /**
       * Allows potentially unsafe TypeScript assignments in config files.
       * Configuration files often need to interact with non-TypeScript systems.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-assignment
       */
      "@typescript-eslint/no-unsafe-assignment": "off",

      /**
       * Allows potentially unsafe function calls in config files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-call
       */
      "@typescript-eslint/no-unsafe-call": "off",

      /**
       * Allows potentially unsafe member access in config files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-member-access
       */
      "@typescript-eslint/no-unsafe-member-access": "off",

      /**
       * Allows potentially unsafe return values in config files.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-return
       */
      "@typescript-eslint/no-unsafe-return": "off",

      /**
       * Allows anonymous default exports in config files.
       *
       * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-anonymous-default-export.md
       */
      "import/no-anonymous-default-export": "off",

      /**
       * Allows default exports in config files.
       * Many build tools expect configuration files to use default exports.
       *
       * 🚫 Not fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
       */
      "import/no-default-export": "off",
    },
  },

  /**
   * Declaration files specific rules.
   * Relaxes certain TypeScript rules for declaration (.d.ts) files.
   */
  {
    files: ["**/*.d.ts"],
    name: "@codefast/eslint-config/next/declarations",
    rules: {
      /**
       * Allows default exports in TypeScript declaration files.
       * Declaration files often need to use default exports to match JavaScript modules.
       *
       * 🚫 Not fixable - https://eslint.org/docs/rules/import/no-default-export
       */
      "import/no-default-export": "off",

      /**
       * Allows using the `any` type in declaration files.
       * Declaration files sometimes need to use `any` for external libraries or complex types.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-explicit-any
       */
      "@typescript-eslint/no-explicit-any": "off",

      /**
       * Allows empty object types like `{}` in declaration files.
       * Declaration files sometimes use empty object types as placeholders.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-empty-object-type
       */
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  prettierConfig,
];
