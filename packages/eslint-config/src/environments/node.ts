import globals from "globals";

import type { Linter } from "eslint";

// Node.js environment configuration
export const nodeEnvironment: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
