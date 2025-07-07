import pluginOnlyWarn from "eslint-plugin-only-warn";

import type { Linter } from "eslint";

// Only warn configuration - converts all errors to warnings
export const onlyWarnRules: Linter.Config[] = [
  {
    plugins: {
      "only-warn": pluginOnlyWarn,
    },
  },
];
