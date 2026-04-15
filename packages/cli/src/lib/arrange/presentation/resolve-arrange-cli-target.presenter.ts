import path from "node:path";
import type { CliFs } from "#lib/core/application/ports/cli-io.port";

export type ResolveArrangeCliTargetPathInput = {
  readonly fs: CliFs;
  readonly currentWorkingDirectory: string;
  readonly rawTarget: string | undefined;
};

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

export function resolveArrangeCliTargetPath(input: ResolveArrangeCliTargetPathInput): string {
  const explicitTargetPath = input.rawTarget
    ? path.isAbsolute(input.rawTarget)
      ? path.resolve(input.rawTarget)
      : path.resolve(input.currentWorkingDirectory, input.rawTarget)
    : undefined;
  if (explicitTargetPath) {
    return input.fs.canonicalPathSync(explicitTargetPath);
  }
  const nearestPackageDirectory = findNearestPackageDirectory(
    input.currentWorkingDirectory,
    input.fs,
  );
  const resolvedDefaultTarget = nearestPackageDirectory ?? input.currentWorkingDirectory;
  return input.fs.canonicalPathSync(resolvedDefaultTarget);
}
