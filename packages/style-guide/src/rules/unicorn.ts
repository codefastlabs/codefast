import type { Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  /**
   * Enforce specific import styles per module.
   *
   * 🚫 Not fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/import-style.md
   */
  'unicorn/import-style': 'off',

  /**
   * Disallow the use of the null literal.
   *
   * 🔧 Fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-null.md
   */
  'unicorn/no-null': 'off',

  /**
   * Disallow `process.exit()`.
   *
   * 🚫 Not fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-process-exit.md
   */
  'unicorn/no-process-exit': 'off',

  /**
   * Prefer globalThis over window, self, and global.
   *
   * 🔧 Fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-global-this.md
   */
  'unicorn/prefer-global-this': 'off',

  /**
   * Prevent abbreviations.
   *
   * 🔧 Fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prevent-abbreviations.md
   */
  'unicorn/prevent-abbreviations': 'off',
};

export const unicornRules: Linter.Config = {
  name: '@codefast/style-guide/rules/unicorn',
  rules: {
    ...disabledRules,

    /**
     * Require a consistent filename case for all linted files.
     *
     * 🚫 Not fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/filename-case.md
     */
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
      },
    ],

    /**
     * Require using the `node:` protocol when importing Node.js built-in modules.
     *
     * 🔧 Fixable - https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md
     */
    'unicorn/prefer-node-protocol': 'warn',
  },
};
