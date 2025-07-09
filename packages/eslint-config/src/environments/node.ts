import globals from "globals";

import type { Linter } from "eslint";

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
