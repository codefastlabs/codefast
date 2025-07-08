import { importRules } from "@/core/import";
import { baseJavaScriptRules } from "@/core/javascript";
import { typescriptRules } from "@/core/typescript";
import { unicornRules } from "@/core/unicorn";
import { nodeEnvironment } from "@/environments/node";
import { testEnvironment } from "@/environments/test";
import { jsonRules } from "@/languages/json";
import { markdownRules } from "@/languages/markdown";
import { composeConfig } from "@/utils/composer";
import { tsdocRules } from "@/utils/tsdoc";

import type { Linter } from "eslint";

export const basePreset: Linter.Config[] = composeConfig(
  // 1. Fast rules first - basic syntax
  baseJavaScriptRules,

  // 2. File-type-specific rules (grouped)
  typescriptRules,
  tsdocRules,
  jsonRules,
  markdownRules,

  // 3. Analysis rules (slower)
  unicornRules,
  importRules,

  // 4. Environment rules last
  nodeEnvironment,
  testEnvironment,
);
