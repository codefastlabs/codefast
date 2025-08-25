import type { Linter } from "eslint";

import { importRules } from "@/core/import";
import { baseJavaScriptRules } from "@/core/javascript";
import { perfectionistRules } from "@/core/perfectionist";
import { stylisticRules } from "@/core/stylistic";
import { typescriptRules } from "@/core/typescript";
import { unicornRules } from "@/core/unicorn";
import { browserEnvironment } from "@/environments/browser";
import { jestEnvironment } from "@/environments/jest";
import { jsonRules } from "@/languages/json";
import { markdownRules } from "@/languages/markdown";
import { jsxA11yRules } from "@/plugins/accessibility/jsx-a11y";
import { reactRules } from "@/plugins/frameworks/react";
import { jestRules } from "@/plugins/testing/jest";
import { prettierRules } from "@/plugins/tooling/prettier";
import { tsdocRules } from "@/plugins/tooling/tsdoc";
import { composeConfig } from "@/shared/composer";

const reactAppPresetCore: Linter.Config[] = composeConfig(
  baseJavaScriptRules,
  stylisticRules,

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
  jestEnvironment,
);

export const reactAppPreset: Linter.Config[] = composeConfig(reactAppPresetCore, prettierRules);

export { reactAppPresetCore };
