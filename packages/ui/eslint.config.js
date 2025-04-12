import { config } from "@codefast/eslint-config/react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    files: ["src/lib/logger.ts", "src/lib/logger.test.ts"],
    rules: {
      /**
       * Allow console statements in logger implementation and tests.
       * Console usage is expected in logging utilities as part of their core functionality.
       *
       * 🚫 Not fixable - https://eslint.org/docs/rules/no-console
       */
      "no-console": "off",
    },
  },
];
