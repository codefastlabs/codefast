import type { Linter } from "eslint";

import eslintPluginPerfectionist from "eslint-plugin-perfectionist";

import { perfectionistRules } from "@/rules/perfectionist";

export const perfectionistConfig: Linter.Config = {
  ...eslintPluginPerfectionist.configs["recommended-natural"],
  name: "@codefast/style-guide/configs/utils/perfectionist",
  rules: {
    ...perfectionistRules.rules,
  },
};
