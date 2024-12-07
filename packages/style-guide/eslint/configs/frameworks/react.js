import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

import { reactRules } from '../../rules/react.js';
import { jsxA11yRules } from '../../rules/jsx-a11y.js';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  importPlugin.flatConfigs.react,
  jsxA11y.flatConfigs.recommended,

  /**
   * Vì react-hooks chưa được nâng cấp lên eslint 9, chúng ta cần khai báo plugins.
   * Cú pháp đề xuất:
   *
   * @example
   * ```js
   * {
   *   ...reactHooks.configs.recommended,
   *   rules: {
   *     ...reactHooks.configs.recommended.rules,
   *   },
   * }
   * ```
   */
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  reactRules,
  jsxA11yRules,
  prettier,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
