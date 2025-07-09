import pluginTurbo, { configs } from "eslint-plugin-turbo";

import type { Linter } from "eslint";

export const turboRules: Linter.Config[] = [
  {
    plugins: {
      turbo: pluginTurbo,
    },
    rules: {
      ...configs.recommended.rules,
    },
  },
];
