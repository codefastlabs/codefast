import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/ports/arrange-target-path-resolver.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";

const PACKAGE_JSON_FILE = "package.json";

@injectable([inject(CliFsToken)])
export class ArrangeTargetPathResolver implements ArrangeTargetPathResolverPort {
  constructor(private readonly fs: CliFs) {}

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
      const packageJsonPath = path.join(currentDir, PACKAGE_JSON_FILE);
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
