import type { Linter } from "eslint";

import pluginOnlyWarn from "eslint-plugin-only-warn";

export const onlyWarnRules: Linter.Config[] = [
  {
    name: "@codefast/eslint-config/plugins/only-warn",
    plugins: {
      "only-warn": pluginOnlyWarn,
    },
  },
];
