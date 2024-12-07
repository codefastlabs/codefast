import { type Linter } from 'eslint';

const disabledRules: Partial<Linter.RulesRecord> = {
  'unicorn/import-style': 'off',
  'unicorn/no-null': 'off',
  'unicorn/prefer-global-this': 'off',
  'unicorn/prevent-abbreviations': 'off',
};

export const unicornRules: Linter.Config = {
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
