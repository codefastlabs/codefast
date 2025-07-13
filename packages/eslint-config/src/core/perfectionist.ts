import type { Linter } from "eslint";

import pluginPerfectionist from "eslint-plugin-perfectionist";

export const perfectionistRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      perfectionist: pluginPerfectionist,
    },
    rules: {
      // Sort export statements
      "perfectionist/sort-exports": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          partitionByNewLine: true,
          type: "alphabetical",
        },
      ],

      // Sort imports - prioritizing perfectionist over import/order
      "perfectionist/sort-imports": [
        "error",
        {
          customGroups: {
            type: {},
            value: {},
          },
          groups: [
            "builtin",
            "external",
            "internal-type",
            "internal",
            ["parent-type", "sibling-type", "index-type"],
            ["parent", "sibling", "index"],
            "object",
            "unknown",
          ],
          ignoreCase: true,
          internalPattern: ["@/*", "~/*"],
          newlinesBetween: "always",
          order: "asc",
          type: "alphabetical",
        },
      ],

      // Sort interface properties (useful for TypeScript exports)
      "perfectionist/sort-interfaces": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          partitionByNewLine: true,
          type: "alphabetical",
        },
      ],

      // Sort named exports alphabetically
      "perfectionist/sort-named-exports": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          partitionByNewLine: true,
          type: "alphabetical",
        },
      ],

      // Sort object properties in exports
      "perfectionist/sort-objects": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          partitionByNewLine: true,
          type: "alphabetical",
        },
      ],

      // Sort type union members
      "perfectionist/sort-union-types": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          partitionByNewLine: true,
          type: "alphabetical",
        },
      ],
    },
  },
];
