import type { Linter } from 'eslint';

/**
 * These are enabled by `import/recommended` but are better handled by
 * TypeScript and @typescript-eslint.
 */
const disabledRules: Partial<Linter.RulesRecord> = {
  'import/default': 'off',
  'import/export': 'off',
  'import/namespace': 'off',
  'import/no-unresolved': 'off',
};

export const typescriptImportRules: Linter.Config = {
  rules: {
    ...disabledRules,
  },
};
