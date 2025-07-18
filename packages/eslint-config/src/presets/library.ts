import type { Linter } from "eslint";

import { basePreset } from "@/presets/base";
import { composeConfig } from "@/utils/composer";
import { prettierRules } from "@/utils/prettier";

const libraryStrictRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];

export const libraryPreset: Linter.Config[] = composeConfig(
  basePreset,
  libraryStrictRules,
  prettierRules,
);
