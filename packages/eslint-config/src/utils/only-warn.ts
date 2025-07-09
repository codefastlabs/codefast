import pluginOnlyWarn from "eslint-plugin-only-warn";

import type { Linter } from "eslint";

export const onlyWarnRules: Linter.Config[] = [
  {
    plugins: {
      "only-warn": pluginOnlyWarn,
    },
  },
];
