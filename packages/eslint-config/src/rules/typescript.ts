import type { Linter } from "eslint";

export const typescriptRules: Linter.Config = {
  name: "@codefast/eslint-config/rules/typescript",
  rules: {
    /**
     * Allow the use of unnecessary type parameters.
     *
     * 🚫 Not fixable - https://typescript-eslint.io/rules/no-unnecessary-type-parameters
     */
    "@typescript-eslint/no-unnecessary-type-parameters": "off",

    /**
     * Restrict the types allowed in template expressions.
     * Only allows numbers in template expressions.
     *
     * 🚫 Not fixable - https://typescript-eslint.io/rules/restrict-template-expressions
     */
    "@typescript-eslint/restrict-template-expressions": ["warn", { allowNumber: true }],
  },
};
