import type { Linter } from "eslint";

import globals from "globals";

export const testEnvironment: Linter.Config[] = [
  {
    files: [
      "**/{*.{test,spec,e2e},test/**,tests/**,__tests__/**,__mocks__/**}.{js,mjs,cjs,ts,jsx,tsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,

        suite: "readonly",
        vi: "readonly",
      },
    },
  },
];
