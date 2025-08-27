import type { Linter } from "eslint";

import globals from "globals";

export const testEnvironment: Linter.Config[] = [
  {
    files: ["**/__tests__/**/*.?([mc])[jt]s?(x)", "**/*.(spec|test).?([mc])[jt]s?(x)"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
