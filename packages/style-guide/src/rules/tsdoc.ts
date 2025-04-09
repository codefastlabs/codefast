import type { Linter } from "eslint";

export const tsdocRules: Linter.Config = {
  name: "@codefast/style-guide/rules/tsdoc",
  rules: {
    /**
     * Require TSDoc comments conform to the TSDoc specification.
     *
     * 🚫 Not fixable - https://github.com/microsoft/tsdoc/tree/master/eslint-plugin
     */
    "tsdoc/syntax": "error",
  },
};
