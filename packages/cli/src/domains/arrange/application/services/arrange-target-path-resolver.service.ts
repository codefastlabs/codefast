import path from "node:path";
import type { CliFs } from "#/shell/application/ports/cli-io.port";

const PACKAGE_JSON_FILE = "package.json";

function findNearestPackageDirectory(
  currentWorkingDirectory: string,
  fs: CliFs,
): string | undefined {
  let currentDir = path.resolve(currentWorkingDirectory);
  while (true) {
    const packageJsonPath = path.join(currentDir, PACKAGE_JSON_FILE);
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

export function resolveArrangeTargetPath(args: {
  readonly fs: CliFs;
  readonly currentWorkingDirectory: string;
  readonly rawTarget: string | undefined;
}): string {
  const explicitTargetPath = args.rawTarget
    ? path.isAbsolute(args.rawTarget)
      ? path.resolve(args.rawTarget)
      : path.resolve(args.currentWorkingDirectory, args.rawTarget)
    : undefined;
  if (explicitTargetPath) {
    return args.fs.canonicalPathSync(explicitTargetPath);
  }
  const nearestPackageDirectory = findNearestPackageDirectory(
    args.currentWorkingDirectory,
    args.fs,
  );
  const resolvedDefaultTarget = nearestPackageDirectory ?? args.currentWorkingDirectory;
  return args.fs.canonicalPathSync(resolvedDefaultTarget);
}
