import type { Linter } from "eslint";

import eslintPluginUnicorn from "eslint-plugin-unicorn";

import { unicornRules } from "@/rules/unicorn";

export const unicornConfig: Linter.Config = {
  ...eslintPluginUnicorn.configs.recommended,
  name: "@codefast/style-guide/configs/utils/unicorn",
  rules: {
    ...eslintPluginUnicorn.configs.recommended.rules,
    ...unicornRules.rules,
  },
};
