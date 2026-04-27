import path from "node:path";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

export type ResolveTagCliTargetPathInput = {
  readonly fs: CliFs;
  readonly currentWorkingDirectory: string;
  readonly rawTarget: string | undefined;
};

export function resolveTagCliTargetPath(input: ResolveTagCliTargetPathInput): string | undefined {
  if (input.rawTarget === undefined) {
    return undefined;
  }
  const candidate = path.isAbsolute(input.rawTarget)
    ? path.resolve(input.rawTarget)
    : path.resolve(input.currentWorkingDirectory, input.rawTarget);
  return input.fs.canonicalPathSync(candidate);
}
