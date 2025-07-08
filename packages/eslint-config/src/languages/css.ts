import css from "@eslint/css";

import type { Linter } from "eslint";

// CSS file configuration
export const cssRules: Linter.Config[] = [
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    rules: {
      ...css.configs.recommended.rules,
    },
  },
];
