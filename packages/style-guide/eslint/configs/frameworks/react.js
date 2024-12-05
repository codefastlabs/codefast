import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

import { config as reactRules } from '../../rules/react.js';
import { config as jsxA11yRules } from '../../rules/jsx-a11y.js';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  // Base React Configurations
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  // Import Plugin Configuration
  importPlugin.flatConfigs.react,

  // Accessibility Plugin Configuration
  jsxA11y.flatConfigs.recommended,

  // Prettier Configuration for Code Style Enforcement
  prettier,

  // React Hooks Configuration
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Custom Rules and Settings
  {
    rules: {
      ...reactRules.rules,
      ...jsxA11yRules.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
