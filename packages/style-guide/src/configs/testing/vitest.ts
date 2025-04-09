import type { Linter } from "eslint";

import eslintPluginVitest from "@vitest/eslint-plugin";

import { vitestRules } from "@/rules/vitest";

export const vitestConfig: Linter.Config = {
  ...eslintPluginVitest.configs.recommended,
  name: "@codefast/style-guide/configs/testing/vitest",
  rules: {
    ...eslintPluginVitest.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
