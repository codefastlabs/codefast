import type { Linter } from 'eslint';

export function composeConfig(...configs: Linter.Config[][]): Linter.Config[] {
  return configs.flat();
}
