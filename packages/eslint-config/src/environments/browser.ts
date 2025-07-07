import globals from "globals";

import type { Linter } from "eslint";

// Browser environment configuration
export const browserEnvironment: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
];
