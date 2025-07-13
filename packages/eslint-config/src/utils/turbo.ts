import type { Linter } from "eslint";
import pluginTurbo, { configs } from "eslint-plugin-turbo";

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
