import type { Linter } from "eslint";

import pluginPerfectionist from "eslint-plugin-perfectionist";

/**
 * Rules that are set to "error" for perfectionist plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical issues that must be fixed
 */
const errorPerfectionistRules: Linter.RulesRecord = {
  /**
   * Sorts export statements alphabetically for better code organization.
   * This rule ensures that all export statements are arranged in ascending alphabetical order,
   * making it easier to locate specific exports in a file.
   */
  "perfectionist/sort-exports": [
    "error",
    {
      ignoreCase: true,
      order: "asc",
      partitionByNewLine: true,
      type: "alphabetical",
    },
  ],

  /**
   * Sorts import statements based on defined groups and ordering.
   * This rule organizes imports into logical groups (side-effects, built-ins, external, internal, etc.)
   * and sorts them alphabetically within each group, improving code readability and maintenance.
   * It takes precedence over the import/order rule.
   */
  "perfectionist/sort-imports": [
    "error",
    {
      groups: [
        "side-effect",
        "type",
        ["builtin", "external"],
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

  /**
   * Sorts named import members alphabetically, matching WebStorm's "Sort import members".
   */
  "perfectionist/sort-named-imports": [
    "error",
    {
      ignoreCase: true,
      order: "asc",
      type: "alphabetical",
    },
  ],

  /**
   * Sorts interface properties alphabetically in TypeScript interfaces.
   * This rule ensures consistent property ordering within interfaces, making it easier
   * to scan and find specific properties, especially in large interface definitions.
   * Particularly useful for TypeScript exports that define data structures.
   */
  "perfectionist/sort-interfaces": [
    "error",
    {
      ignoreCase: true,
      order: "asc",
      partitionByNewLine: true,
      type: "alphabetical",
    },
  ],

  /**
   * Sorts named exports alphabetically within a named export statement.
   * This rule ensures that exports with multiple items have consistent internal ordering,
   * making it easier to scan export lists and find specific exported members.
   * Especially helpful in files with many named exports.
   */
  "perfectionist/sort-named-exports": [
    "error",
    {
      ignoreCase: true,
      order: "asc",
      partitionByNewLine: true,
      type: "alphabetical",
    },
  ],

  /**
   * Sorts object properties alphabetically for consistent property ordering.
   * This rule standardizes the order of properties in object literals throughout the codebase,
   * making objects easier to read and properties easier to locate, especially in
   * configuration objects and export definitions.
   */
  "perfectionist/sort-objects": [
    "error",
    {
      type: "unsorted",
      useConfigurationIf: {
        callingFunctionNamePattern: "^(cn|cx|clsx|tv|cva|classNames)$",
      },
    },
    {
      ignoreCase: true,
      order: "asc",
      partitionByNewLine: true,
      type: "alphabetical",
    },
  ],

  /**
   * Sorts type union members alphabetically in TypeScript union types.
   * This rule ensures that union type definitions have consistent ordering of their members,
   * making it easier to read and maintain type definitions, and helping to prevent
   * accidental duplication of union members.
   */
  "perfectionist/sort-union-types": [
    "error",
    {
      ignoreCase: true,
      order: "asc",
      partitionByNewLine: true,
      type: "alphabetical",
    },
  ],
};

export const perfectionistRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    name: "@codefast/eslint-config/core/perfectionist",
    plugins: {
      perfectionist: pluginPerfectionist,
    },
    rules: {
      // Apply all error rules
      ...errorPerfectionistRules,
    },
  },
];
