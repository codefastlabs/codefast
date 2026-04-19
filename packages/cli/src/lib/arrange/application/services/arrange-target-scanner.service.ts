import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";
import type { ArrangeTargetScannerService } from "#/lib/tokens";
import { CliPathToken, FileWalkerPortToken } from "#/lib/tokens";

@injectable([inject(FileWalkerPortToken), inject(CliPathToken)])
export class ArrangeTargetScannerServiceImpl implements ArrangeTargetScannerService {
  constructor(
    private readonly fileWalker: FileWalkerPort,
    private readonly path: CliPath,
  ) {}

  scanTarget(args: { readonly targetPath: string; readonly fs: CliFs }): string[] {
    const resolvedTargetPath = this.path.resolve(args.targetPath);
    if (args.fs.statSync(resolvedTargetPath).isDirectory()) {
      return this.fileWalker.walkTypeScriptFiles(resolvedTargetPath, args.fs);
    }
    return [resolvedTargetPath];
  }
}
