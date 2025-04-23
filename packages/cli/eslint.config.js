import { config } from "@codefast/eslint-config/library";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      "no-console": "off",
    },
  },
];
