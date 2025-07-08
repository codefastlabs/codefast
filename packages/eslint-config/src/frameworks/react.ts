import pluginReact from "eslint-plugin-react";
import * as pluginReactHooks from "eslint-plugin-react-hooks";

import type { Linter } from "eslint";

// React framework configuration
export const reactRules: Linter.Config[] = [
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["cmdk-input-wrapper"],
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
