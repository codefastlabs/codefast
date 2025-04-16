import type { Linter } from "eslint";

import { bestPracticeRules } from "@/rules/best-practice";

export const prettierRules: Linter.Config = {
  name: "@codefast/style-guide/rules/prettier",
  rules: {
    /**
     * Enable Prettier integration with ESLint as warnings rather than errors
     * to improve developer experience while maintaining code style.
     *
     * 🔧 Fixable - https://github.com/prettier/eslint-plugin-prettier
     */
    "prettier/prettier": "warn",

    /**
     * Require a consistent brace style for all control statements.
     * This rule is inherited from best practices configuration.
     */
    curly: bestPracticeRules.rules?.curly,
  },
};
