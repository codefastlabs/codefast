import { basePreset } from "@/presets/base";
import { composeConfig } from "@/utils/composer";
import { prettierRules } from "@/utils/prettier";

import type { Linter } from "eslint";

const libraryStrictRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      // Stricter rules for libraries
      "no-console": "warn", // Libraries shouldn't log to the console
      "@typescript-eslint/explicit-function-return-type": "warn", // Better API documentation
      "@typescript-eslint/no-explicit-any": "error", // Type safety is crucial for libraries
      "prefer-const": "error", // Consistent immutability patterns
      "no-var": "error", // Modern JavaScript practices
    },
  },
];

export const libraryPreset: Linter.Config[] = composeConfig(basePreset, libraryStrictRules, prettierRules);
