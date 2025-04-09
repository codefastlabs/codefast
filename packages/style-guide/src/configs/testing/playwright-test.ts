import type { Linter } from "eslint";

import eslintPluginPlaywright from "eslint-plugin-playwright";

import { playwrightTestRules } from "@/rules/playwright-test";

export const playwrightTestConfig: Linter.Config = {
  ...eslintPluginPlaywright.configs["flat/recommended"],
  name: "@codefast/style-guide/configs/testing/playwright-test",
  rules: {
    ...eslintPluginPlaywright.configs["flat/recommended"].rules,
    ...playwrightTestRules.rules,
  },
};
