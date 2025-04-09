import type { Linter } from "eslint";

import jsConfig from "@eslint/js";

import { commentsConfig } from "@/configs/utils/comments";
import { importConfig } from "@/configs/utils/import";
import { perfectionistConfig } from "@/configs/utils/perfectionist";
import { stylisticConfig } from "@/configs/utils/stylistic";
import { unicornConfig } from "@/configs/utils/unicorn";
import { bestPracticeRules } from "@/rules/best-practice";
import { commonRules } from "@/rules/common";
import { es6Rules } from "@/rules/es6";
import { possibleErrorsRules } from "@/rules/possible-errors";
import { variablesRules } from "@/rules/variables";

/**
 * This is the base for both our browser and Node ESLint config files.
 */
export const recommendedConfig: Linter.Config[] = [
  {
    ...jsConfig.configs.recommended,
    name: "@codefast/style-guide/configs/core/recommended",
  },
  {
    ...commentsConfig,
    name: "@codefast/style-guide/configs/core/recommended/comments",
  },
  {
    ...importConfig,
    name: "@codefast/style-guide/configs/core/recommended/import",
  },
  {
    ...unicornConfig,
    name: "@codefast/style-guide/configs/core/recommended/unicorn",
  },
  {
    ...perfectionistConfig,
    name: "@codefast/style-guide/configs/core/recommended/perfectionist",
  },
  {
    ...stylisticConfig,
    name: "@codefast/style-guide/configs/core/recommended/stylistic",
  },
  {
    name: "@codefast/style-guide/configs/core/recommended/rules",
    rules: {
      ...bestPracticeRules.rules,
      ...es6Rules.rules,
      ...possibleErrorsRules.rules,
      ...commonRules.rules,
      ...variablesRules.rules,
    },
  },
];
