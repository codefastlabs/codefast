/**
 * Defines stylistic rules for the codebase to ensure consistent code formatting.
 * These rules enforce consistent spacing, line breaks, and code structure.
 */
import type { Linter } from "eslint";

import stylistic from "@stylistic/eslint-plugin";

/**
 * Rules that are set to "error" for stylistic plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical issues that must be fixed
 */
const errorStylisticRules: Linter.RulesRecord = {
  /**
   * Requires or disallows blank lines between statements.
   * Helps improve code readability by enforcing consistent spacing between different code blocks.
   */
  "@stylistic/padding-line-between-statements": [
    "error",

    /**
     * Enforces blank lines between variable declarations and other statements.
     * This improves readability by visually separating variable declarations from the rest of the code.
     */
    {
      blankLine: "always",
      next: "*",
      prev: ["const", "let", "var"],
    },
    {
      blankLine: "any",
      next: ["const", "let", "var"],
      prev: ["const", "let", "var"],
    },

    /**
     * Enforces blank lines between directives and other statements.
     * Directives (like 'use strict') should be visually separated from the rest of the code.
     */
    {
      blankLine: "always",
      next: "*",
      prev: "directive",
    },

    /**
     * Allows any blank line style between consecutive directives.
     * Consecutive directives can be grouped together without mandatory blank lines.
     */
    {
      blankLine: "any",
      next: "directive",
      prev: "directive",
    },

    /**
     * Enforces blank lines after case/default statements in switch blocks.
     * This improves readability by clearly separating different switch cases.
     */
    {
      blankLine: "always",
      next: "*",
      prev: ["case", "default"],
    },

    /**
     * Enforces blank lines before return statements.
     * This improves readability by visually separating the return statement from the preceding code,
     * making it easier to identify where functions exit.
     */
    {
      blankLine: "always",
      next: "return",
      prev: "*",
    },

    /**
     * Enforces blank lines after block statements.
     * Block statements (like if, for, while, try blocks) should have blank lines below them
     * to improve readability by visually separating different code sections.
     */
    {
      blankLine: "always",
      next: "*",
      prev: ["if", "for", "while", "do", "try", "with"],
    },

    /**
     * Enforces blank lines after block-like statements.
     * Block-like statements (like function declarations, class declarations) should have blank lines below them
     * to improve readability by visually separating different code sections.
     */
    {
      blankLine: "always",
      next: "*",
      prev: ["function", "class"],
    },

    /**
     * Enforces blank lines before block statements.
     * Block statements (like if, for, while, do, try blocks) should have blank lines above them
     * to improve readability by visually separating different code sections.
     */
    {
      blankLine: "always",
      next: ["if", "for", "while", "do", "try", "with"],
      prev: "*",
    },

    /**
     * Enforces blank lines before block-like statements.
     * Block-like statements (like function declarations, class declarations) should have blank lines above them
     * to improve readability by visually separating different code sections.
     */
    {
      blankLine: "always",
      next: ["function", "class"],
      prev: "*",
    },
  ],
};

export const stylisticRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      ...stylistic.configs.recommended.rules,

      // Apply all error rules
      ...errorStylisticRules,
    },
  },
];
