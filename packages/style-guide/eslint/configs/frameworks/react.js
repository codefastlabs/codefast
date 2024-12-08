import reactPlugin from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

import { reactHooksConfig } from '../utils/react-hooks.js';
import { jsxA11yConfig } from '../utils/jsx-a11y.js';
import { reactRules } from '../../rules/react.js';

/** @type {import('eslint').Linter.Config[]} */
export const reactConfig = [
  {
    ...reactPlugin.configs.flat.recommended,
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactRules.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  reactPlugin.configs.flat['jsx-runtime'],
  importPlugin.flatConfigs.react,
  jsxA11yConfig,
  reactHooksConfig,
  prettierConfig,
];
