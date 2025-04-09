import { recommendedConfig } from "@codefast/style-guide/configs/core/recommended";
import { typescriptConfig } from "@codefast/style-guide/configs/core/typescript";
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
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
];
