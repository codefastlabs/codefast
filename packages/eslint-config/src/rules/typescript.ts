import type { Linter } from "eslint";

export const typescriptRules: Linter.Config = {
  name: "@codefast/eslint-config/rules/typescript",
  rules: {
    "@typescript-eslint/no-unnecessary-type-parameters": "off",

    "@typescript-eslint/restrict-template-expressions": ["warn", { allowNumber: true }],
  },
};
