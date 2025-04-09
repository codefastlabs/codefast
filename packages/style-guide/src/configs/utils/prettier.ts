import type { Linter } from "eslint";

import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

import { prettierRules } from "@/rules/prettier";

export const prettierConfig: Linter.Config = {
  ...eslintPluginPrettier,
  name: "@codefast/style-guide/configs/utils/prettier",
  rules: {
    ...eslintPluginPrettier.rules,
    ...prettierRules.rules,
  },
};
