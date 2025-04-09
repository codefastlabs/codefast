import type { Linter } from "eslint";

export const jestTypescriptConfig: Linter.Config = {
  name: "@codefast/style-guide/configs/testing/jest-typescript",
  rules: {
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/unbound-method": "off",
    "jest/unbound-method": "error",
  },
};
