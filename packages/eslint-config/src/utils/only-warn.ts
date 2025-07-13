import type { Linter } from "eslint";
import pluginOnlyWarn from "eslint-plugin-only-warn";

export const onlyWarnRules: Linter.Config[] = [
  {
    plugins: {
      "only-warn": pluginOnlyWarn,
    },
  },
];
