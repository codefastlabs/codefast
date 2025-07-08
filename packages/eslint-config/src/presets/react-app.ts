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
  // 1. Fast rules first - basic syntax
  baseJavaScriptRules,

  // 2. File-type-specific rules (grouped)
  typescriptRules,
  jsonRules,
  markdownRules,

  // 3. Framework-specific rules (medium speed)
  reactRules,
  jsxA11yRules,
  jestRules,

  // 4. Analysis rules (slower)
  unicornRules,
  importRules,

  // 5. Environment rules last
  browserEnvironment,
  testEnvironment,
);

// React app preset - configuration for React applications
export const reactAppPreset: Linter.Config[] = composeConfig(reactAppPresetCore, prettierRules);

// Export the core preset for internal use by other presets
export { reactAppPresetCore };
