import type { Linter } from "eslint";

import { nodeEnvironment } from "@/environments/node";
import { nextRules } from "@/frameworks/next";
import { reactAppPresetCore } from "@/presets/react-app";
import { composeConfig } from "@/utils/composer";
import { prettierRules } from "@/utils/prettier";

export const nextAppPreset: Linter.Config[] = composeConfig(
  reactAppPresetCore,
  nextRules,

  nodeEnvironment,

  prettierRules,
);
