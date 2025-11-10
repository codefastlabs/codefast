import type { Linter } from "eslint";

import pluginTurbo, { configs } from "eslint-plugin-turbo";

export const turboRules: Linter.Config[] = [
  {
    name: "@codefast/eslint-config/plugins/turbo",
    plugins: {
      turbo: pluginTurbo,
    },
    rules: {
      ...configs.recommended.rules,
    },
  },
];
