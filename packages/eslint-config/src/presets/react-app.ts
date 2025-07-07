import { importRules } from "@/core/import";
import { baseJavaScriptRules } from "@/core/javascript";
import { typescriptRules } from "@/core/typescript";
import { unicornRules } from "@/core/unicorn";
import { browserEnvironment } from "@/environments/browser";
import { jsxA11yRules } from "@/frameworks/jsx-a11y";
import { reactRules } from "@/frameworks/react";
import { cssRules } from "@/languages/css";
import { jsonRules } from "@/languages/json";
import { markdownRules } from "@/languages/markdown";
import { jestRules } from "@/testing/jest";
import { composeConfig } from "@/utils/composer";
import { prettierRules } from "@/utils/prettier";

import type { Linter } from "eslint";

// React app preset - configuration for React applications
export const reactAppPreset: Linter.Config[] = composeConfig(
  baseJavaScriptRules,
  typescriptRules,
  unicornRules,
  importRules,
  browserEnvironment,
  jsonRules,
  markdownRules,
  cssRules,
  reactRules,
  jsxA11yRules,
  jestRules,
  prettierRules,
);
