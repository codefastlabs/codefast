import type { Linter } from "eslint";

import { disabledReactRules } from "@/frameworks/react";
import pluginNext from "@next/eslint-plugin-next";

/**
 * Rules that are disabled (set to "off") for Next.js plugin
 * These rules are grouped together for better organization and maintainability
 */
const disabledNextRules: Linter.RulesRecord = {
  /**
   * Disable Next.js specific HTML link validation for pages
   * Often disabled when using custom routing or link components
   */
  "@next/next/no-html-link-for-pages": "off",
};

export const nextRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,

      // Apply all disabled rules
      ...disabledNextRules,
      ...disabledReactRules,
    },
  },
];
