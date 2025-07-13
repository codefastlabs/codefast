import type { Linter } from "eslint";
import globals from "globals";

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
