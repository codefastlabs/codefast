import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";

export function resolveProvidedTagTargetPath(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): string | undefined {
  if (args.rawTarget === undefined) {
    return undefined;
  }
  const candidate = path.isAbsolute(args.rawTarget)
    ? path.resolve(args.rawTarget)
    : path.resolve(args.currentWorkingDirectory, args.rawTarget);
  return fs.canonicalPathSync(candidate);
}
