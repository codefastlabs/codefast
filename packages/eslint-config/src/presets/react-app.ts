import { importRules } from "@/core/import";
import { baseJavaScriptRules } from "@/core/javascript";
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

import type { Linter } from "eslint";

// Internal React app preset without prettier - for composition with other presets
const reactAppPresetCore: Linter.Config[] = composeConfig(
  baseJavaScriptRules,
  typescriptRules,
  unicornRules,
  importRules,
  browserEnvironment,
  testEnvironment,
  jsonRules,
  markdownRules,
  reactRules,
  jsxA11yRules,
  jestRules,
);

// React app preset - configuration for React applications
export const reactAppPreset: Linter.Config[] = composeConfig(reactAppPresetCore, prettierRules);

// Export the core preset for internal use by other presets
export { reactAppPresetCore };
