import type { Linter } from 'eslint';

import pluginTsdoc from 'eslint-plugin-tsdoc';

/**
 * Rules that are set to "warn" for TSDoc plugin
 * These rules are grouped together for better organization and maintainability
 * These rules highlight documentation issues that should be addressed but don't break functionality
 */
const warningTsdocRules: Linter.RulesRecord = {
  /**
   * Validates TSDoc syntax in TypeScript comments
   * Set to "warn" to encourage proper documentation without blocking development
   */
  'tsdoc/syntax': 'warn',
};

export const tsdocRules: Linter.Config[] = [
  {
    files: ['**/*.{ts,tsx}'],
    name: '@codefast/eslint-config/plugins/tsdoc',
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      // Apply all warning rules
      ...warningTsdocRules,
    },
  },
];
