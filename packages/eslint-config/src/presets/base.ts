import type { Linter } from "eslint";

import { importRules } from "@/core/import";
import { baseJavaScriptRules } from "@/core/javascript";
import { perfectionistRules } from "@/core/perfectionist";
import { stylisticRules } from "@/core/stylistic";
import { typescriptRules } from "@/core/typescript";
import { unicornRules } from "@/core/unicorn";
import { jestEnvironment } from "@/environments/jest";
import { nodeEnvironment } from "@/environments/node";
import { jsonRules } from "@/languages/json";
import { markdownRules } from "@/languages/markdown";
import { tsdocRules } from "@/plugins/tooling/tsdoc";
import { composeConfig } from "@/shared/composer";

export const basePreset: Linter.Config[] = composeConfig(
  baseJavaScriptRules,
  stylisticRules,

  typescriptRules,
  tsdocRules,
  jsonRules,
  markdownRules,

  unicornRules,
  importRules,
  perfectionistRules,

  nodeEnvironment,
  jestEnvironment,
);
