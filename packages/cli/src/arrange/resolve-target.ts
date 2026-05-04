import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem";

const packageJsonFileName = "package.json";

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
  const nearestPackageDirectory = findNearestPackageDirectory(fs, args.currentWorkingDirectory);
  const resolvedDefaultTarget = nearestPackageDirectory ?? args.currentWorkingDirectory;
  return fs.canonicalPathSync(resolvedDefaultTarget);
}

function findNearestPackageDirectory(
  fs: FilesystemPort,
  currentWorkingDirectory: string,
): string | undefined {
  let currentDir = path.resolve(currentWorkingDirectory);
  while (true) {
    const packageJsonPath = path.join(currentDir, packageJsonFileName);
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    const parentDirectory = path.dirname(currentDir);
    if (parentDirectory === currentDir) {
      return undefined;
    }
    currentDir = parentDirectory;
  }
}
