import type { Linter } from "eslint";

import pluginReact from "eslint-plugin-react";
import * as pluginReactHooks from "eslint-plugin-react-hooks";

/**
 * Rules that are disabled (set to "off") for React plugin
 * These rules are grouped together for better organization and maintainability
 * These rules are commonly disabled in modern React applications
 */
export const disabledReactRules = {
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
} as const;

export const reactRules: Linter.Config[] = [
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,

      // Apply all disabled rules
      ...disabledReactRules,

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
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["cmdk-input-wrapper"],
        },
      ],
      "react/no-unstable-nested-components": [
        "error",
        {
          allowAsProps: false,
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
