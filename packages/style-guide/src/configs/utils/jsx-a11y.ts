import type { Linter } from "eslint";

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";

import { jsxA11yRules } from "@/rules/jsx-a11y";

export const jsxA11yConfig: Linter.Config = {
  ...eslintPluginJsxA11y.flatConfigs.recommended,
  name: "@codefast/style-guide/configs/utils/jsx-a11y",
  rules: {
    ...eslintPluginJsxA11y.flatConfigs.recommended.rules,
    ...jsxA11yRules.rules,
  },
};
