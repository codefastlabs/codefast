import type { Linter } from 'eslint';

export const sharedRules: Linter.Config = {
  rules: {
    /**
     * This configuration rule is part of the `@typescript-eslint` package.
     *
     * It disables the rule that enforces the removal of unnecessary type parameters in TypeScript.
     *
     * By turning off '`no-unnecessary-type-parameters`', developers can define type parameters in
     * functions, classes, or interfaces even when those parameters aren't strictly required for
     * type inference or checking.
     *
     * This can be useful in scenarios where explicit type parameters are used for consistency,
     * readability, or future-proofing code even if they aren't technically required by the current
     * implementation.
     *
     * https://typescript-eslint.io/rules/no-unnecessary-type-parameters/
     */
    '@typescript-eslint/no-unnecessary-type-parameters': 'off',

    /**
     * Warns when non-string types are used in template expressions but allows numbers
     *
     * 🚫 Not fixable - https://typescript-eslint.io/rules/restrict-template-expressions/
     */
    '@typescript-eslint/restrict-template-expressions': [
      'warn',
      {
        allowNumber: true,
      },
    ],

    /**
     * Disables the rule that disallows default exports
     *
     * https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
     */
    'import/no-default-export': 'off',
  },
};
