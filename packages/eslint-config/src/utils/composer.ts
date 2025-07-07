import type { Linter } from "eslint";

// Configuration composition utilities
export function composeConfig(...configs: Linter.Config[][]): Linter.Config[] {
  return configs.flat();
}
