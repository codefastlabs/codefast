import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import reactRules from '../../rules/react';
import jsxA11yRules from '../../rules/jsx-a11y';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base React Configurations
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  // Import Plugin Configuration
  importPlugin.flatConfigs.react,

  // Accessibility Plugin Configuration
  jsxA11y.flatConfigs.recommended,

  // Prettier Configuration for Code Style Enforcement
  prettier,

  // Extend Language Options with Globals
  {
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },

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
        // Automatically detect the React version
        version: 'detect',
      },
    },
  },
];
