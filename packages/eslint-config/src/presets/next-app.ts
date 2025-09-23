import type { Linter } from "eslint";

import { nodeEnvironment } from "@/environments/node";
import { nextRules } from "@/plugins/frameworks/next";
import { prettierRules } from "@/plugins/tooling/prettier";
import { reactAppPresetCore } from "@/presets/react-app";
import { composeConfig } from "@/shared/composer";

export const nextAppPreset: Linter.Config[] = composeConfig(
  [
    // Ignore Next.js generated files
    {
      ignores: ["next-env.d.ts", ".next/**/*", "out/**/*", "build/**/*", "dist/**/*"],
    },
  ],
  reactAppPresetCore,
  nextRules,

  nodeEnvironment,

  prettierRules,
);
