import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/ports/outbound/arrange-target-path-resolver.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliFilesystemPortToken)])
export class ArrangeTargetPathResolver implements ArrangeTargetPathResolverPort {
  private readonly packageJsonFileName = "package.json";

  constructor(private readonly fs: CliFilesystemPort) {}

  resolveTargetPath(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): string {
    const explicitTargetPath = args.rawTarget
      ? path.isAbsolute(args.rawTarget)
        ? path.resolve(args.rawTarget)
        : path.resolve(args.currentWorkingDirectory, args.rawTarget)
      : undefined;
    if (explicitTargetPath) {
      return this.fs.canonicalPathSync(explicitTargetPath);
    }
    const nearestPackageDirectory = this.findNearestPackageDirectory(args.currentWorkingDirectory);
    const resolvedDefaultTarget = nearestPackageDirectory ?? args.currentWorkingDirectory;
    return this.fs.canonicalPathSync(resolvedDefaultTarget);
  }

  private findNearestPackageDirectory(currentWorkingDirectory: string): string | undefined {
    let currentDir = path.resolve(currentWorkingDirectory);
    while (true) {
      const packageJsonPath = path.join(currentDir, this.packageJsonFileName);
      if (this.fs.existsSync(packageJsonPath)) {
        return currentDir;
      }
      const parentDirectory = path.dirname(currentDir);
      if (parentDirectory === currentDir) {
        return undefined;
      }
      currentDir = parentDirectory;
    }
  }
}
