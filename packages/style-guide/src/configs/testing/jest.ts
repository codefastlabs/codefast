import type { Linter } from "eslint";

import eslintPluginJest from "eslint-plugin-jest";

import { jestRules } from "@/rules/jest";

export const jestConfig: Linter.Config = {
  ...eslintPluginJest.configs["flat/recommended"],
  name: "@codefast/style-guide/configs/testing/jest",
  rules: {
    ...eslintPluginJest.configs["flat/recommended"].rules,
    ...jestRules.rules,
  },
};
