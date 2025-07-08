import pluginTsdoc from "eslint-plugin-tsdoc";

import type { Linter } from "eslint";

export const tsdocRules: Linter.Config[] = [
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      "tsdoc/syntax": "warn",
    },
  },
];
