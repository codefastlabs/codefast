import pluginNext from "@next/eslint-plugin-next";

import type { Linter } from "eslint";

// Next.js framework configuration
export const nextRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      // Custom Next.js specific rules
      "@next/next/no-html-link-for-pages": "off",
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React import
      "react/prop-types": "off", // TypeScript handles prop validation
    },
  },
];
