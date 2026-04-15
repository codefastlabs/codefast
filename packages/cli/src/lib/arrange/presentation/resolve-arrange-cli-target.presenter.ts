import path from "node:path";
import { DEFAULT_ARRANGE_TARGET } from "#lib/arrange/domain/constants.domain";

export function resolveArrangeCliTargetPath(
  currentWorkingDirectory: string,
  target: string | undefined,
): string {
  return target
    ? path.resolve(target)
    : path.resolve(currentWorkingDirectory, DEFAULT_ARRANGE_TARGET);
}
