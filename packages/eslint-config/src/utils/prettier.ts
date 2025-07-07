import prettierConfig from "eslint-config-prettier";

import type { Linter } from "eslint";

// Prettier configuration - disables ESLint rules that conflict with Prettier
export const prettierRules: Linter.Config[] = [prettierConfig];
