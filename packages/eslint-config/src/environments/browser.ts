import type { Linter } from "eslint";
import globals from "globals";

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
