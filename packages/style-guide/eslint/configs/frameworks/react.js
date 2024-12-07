import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

import { reactRules } from '../../rules/react.js';
import { jsxA11yRules } from '../../rules/jsx-a11y.js';

/** @type {import('eslint').Linter.Config[]} */
export const react = [
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  importPlugin.flatConfigs.react,
  jsxA11yPlugin.flatConfigs.recommended,
  /**
   * Vì react-hooks chưa được nâng cấp lên eslint 9, chúng ta cần khai báo plugins.
   * Cú pháp đề xuất:
   *
   * @example
   * ```js
   * {
   *   ...reactHooksPlugin.configs.recommended,
   *   rules: {
   *     ...reactHooksPlugin.configs.recommended.rules,
   *   },
   * }
   * ```
   */
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  reactRules,
  jsxA11yRules,
  prettierConfig,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
