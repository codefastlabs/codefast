import type { Linter } from "eslint";

import { importRules } from "@/core/import";
import { baseJavaScriptRules } from "@/core/javascript";
import { perfectionistRules } from "@/core/perfectionist";
import { typescriptRules } from "@/core/typescript";
import { unicornRules } from "@/core/unicorn";
import { browserEnvironment } from "@/environments/browser";
import { testEnvironment } from "@/environments/test";
import { jsxA11yRules } from "@/frameworks/jsx-a11y";
import { reactRules } from "@/frameworks/react";
import { jsonRules } from "@/languages/json";
import { markdownRules } from "@/languages/markdown";
import { jestRules } from "@/testing/jest";
import { composeConfig } from "@/utils/composer";
import { prettierRules } from "@/utils/prettier";
import { tsdocRules } from "@/utils/tsdoc";

const reactAppPresetCore: Linter.Config[] = composeConfig(
  baseJavaScriptRules,

  typescriptRules,
  tsdocRules,
  jsonRules,
  markdownRules,

  reactRules,
  jsxA11yRules,
  jestRules,

  unicornRules,
  importRules,
  perfectionistRules,

  browserEnvironment,
  testEnvironment,
);

export const reactAppPreset: Linter.Config[] = composeConfig(reactAppPresetCore, prettierRules);

export { reactAppPresetCore };
