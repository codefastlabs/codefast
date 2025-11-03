import type { Linter } from "eslint";

import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

/**
 * Rules that are disabled (set to "off") for React plugin
 * These rules are grouped together for better organization and maintainability
 * These rules are commonly disabled in modern React applications
 */
export const disabledReactRules: Linter.RulesRecord = {
  /**
   * Disable prop-types validation
   * is Not needed when using TypeScript for type checking
   */
  "react/prop-types": "off",

  /**
   * Disable requirement for React to be in scope
   * is Not needed in React 17+ with the new JSX transform
   */
  "react/react-in-jsx-scope": "off",
};

/**
 * Rules that are set to "error" for React plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical React issues that must be fixed
 */
const errorReactRules: Linter.RulesRecord = {
  /**
   * Enforces consistent sorting of JSX props
   * Configured for better readability and consistency
   */
  "react/jsx-sort-props": [
    "error",
    {
      callbacksLast: true,
      ignoreCase: true,
      multiline: "ignore",
      noSortAlphabetically: false,
      reservedFirst: true,
      shorthandFirst: true,
      shorthandLast: false,
    },
  ],

  /**
   * Prevents usage of unknown DOM properties
   * Configured to ignore specific properties that are commonly used
   */
  "react/no-unknown-property": [
    "error",
    {
      ignore: ["cmdk-input-wrapper"],
    },
  ],

  /**
   * Prevents unstable nested components that can cause performance issues
   * Configured to disallow components as props to prevent re-rendering issues
   */
  "react/no-unstable-nested-components": [
    "error",
    {
      allowAsProps: false,
    },
  ],
};

export const reactRules: Linter.Config[] = [
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReactHooks.configs.flat.recommended,
  },
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,

      // Apply all disabled rules
      ...disabledReactRules,

      // Apply all error rules
      ...errorReactRules,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
