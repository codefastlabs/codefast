import { inject, injectable } from "@codefast/di";
import type { ArrangeTargetScannerService } from "#/lib/arrange/contracts/services.contract";
import { FileWalkerPortToken } from "#/lib/arrange/contracts/tokens";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import { CliPathToken } from "#/lib/core/operational/contracts/tokens";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";

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
