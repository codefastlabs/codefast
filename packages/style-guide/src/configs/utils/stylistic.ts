import type { Linter } from "eslint";

import eslintPluginStylistic from "@stylistic/eslint-plugin";

import { stylisticRules } from "@/rules/stylistic";

export const stylisticConfig: Linter.Config = {
  name: "@codefast/style-guide/configs/utils/stylistic",
  plugins: {
    "@stylistic": eslintPluginStylistic,
  },
  rules: {
    ...stylisticRules.rules,
  },
};
