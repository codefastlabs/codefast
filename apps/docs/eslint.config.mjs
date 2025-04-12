import { config } from "@codefast/eslint-config/next";

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [
  ...config,
  {
    files: ["next.config.ts"],
    rules: {
      /**
       * Disable the requirement for async functions to have at least one await expression.
       * Required for Next.js config functions that may be async without awaiting anything.
       *
       * 🚫 Not fixable - https://typescript-eslint.io/rules/require-await
       */
      "@typescript-eslint/require-await": "off",
    },
  },
];

export default eslintConfig;
