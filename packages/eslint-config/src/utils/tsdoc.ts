import type { Linter } from "eslint";
import pluginTsdoc from "eslint-plugin-tsdoc";

export const tsdocRules: Linter.Config[] = [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      "tsdoc/syntax": "warn",
    },
  },
];
