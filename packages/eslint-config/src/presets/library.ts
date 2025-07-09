import { basePreset } from "@/presets/base";
import { composeConfig } from "@/utils/composer";
import { prettierRules } from "@/utils/prettier";

import type { Linter } from "eslint";

const libraryStrictRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      "no-console": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];

export const libraryPreset: Linter.Config[] = composeConfig(basePreset, libraryStrictRules, prettierRules);
