import type { Linter } from 'eslint';

export const importRules: Linter.Config = {
  name: '@codefast/eslint-config/rules/import',
  rules: {
    /**
     * Disables the rule that disallows default exports
     *
     * https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
     */
    'import/no-default-export': 'off',
  },
};
