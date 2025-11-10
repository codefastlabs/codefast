import type { Linter } from "eslint";

import prettierConfig from "eslint-config-prettier";

export const prettierRules: Linter.Config[] = [
  {
    name: "@codefast/eslint-config/plugins/prettier",
    ...prettierConfig,
  },
];
