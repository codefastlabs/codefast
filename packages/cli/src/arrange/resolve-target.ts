import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";
import { findNearestAncestor } from "#/core/workspace/ancestor-directories";

/**
 * Resolves the arrange target to a canonical path, defaulting to the nearest package directory.
 *
 * @since 0.3.16-canary.0
 */
export function resolveArrangeTargetPath(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): string {
  const explicitTargetPath = args.rawTarget
    ? path.isAbsolute(args.rawTarget)
      ? path.resolve(args.rawTarget)
      : path.resolve(args.currentWorkingDirectory, args.rawTarget)
    : undefined;
  if (explicitTargetPath) {
    return fs.canonicalPathSync(explicitTargetPath);
  }
  const nearestPackageDirectory = findNearestAncestor(args.currentWorkingDirectory, (directoryPath) =>
    fs.existsSync(path.join(directoryPath, "package.json")),
  );
  const resolvedDefaultTarget = nearestPackageDirectory ?? args.currentWorkingDirectory;
  return fs.canonicalPathSync(resolvedDefaultTarget);
}
