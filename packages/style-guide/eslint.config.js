import { recommendedConfig } from "@codefast/style-guide/core/recommended";
import { typescriptConfig } from "@codefast/style-guide/core/typescript";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...recommendedConfig,
  ...typescriptConfig,
  {
    ignores: ["dist/", "build/"],
  },
  {
    files: ["*.config.*"],
    rules: {
      /**
       * Allow default exports in configuration files.
       * Config files typically use default exports by convention.
       *
       * 🔧 Fixable - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
       */
      "import/no-default-export": "off",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    rules: {
      /**
       * Allow unsafe assignment operations in TypeScript.
       * Useful when working with external libraries or complex type scenarios.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-assignment
       */
      "@typescript-eslint/no-unsafe-assignment": "off",

      /**
       * Allow unsafe member access in TypeScript.
       * Disabling this rule when working with dynamic properties or external APIs.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unsafe-member-access
       */
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
];
