import { inject, injectable } from "@codefast/di";
import type { ArrangeTargetScannerService } from "#/lib/arrange/contracts/services.contract";
import { FileWalkerPortToken } from "#/lib/arrange/contracts/tokens";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import { CliFsToken, CliPathToken } from "#/lib/core/contracts/tokens";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";

@injectable([inject(FileWalkerPortToken), inject(CliPathToken), inject(CliFsToken)])
export class ArrangeTargetScannerServiceImpl implements ArrangeTargetScannerService {
  constructor(
    private readonly fileWalker: FileWalkerPort,
    private readonly path: CliPath,
    private readonly fs: CliFs,
  ) {}

  scanTarget(args: { readonly targetPath: string }): string[] {
    const resolvedTargetPath = this.path.resolve(args.targetPath);
    if (this.fs.statSync(resolvedTargetPath).isDirectory()) {
      return this.fileWalker.walkTypeScriptFiles(resolvedTargetPath, this.fs);
    }
    return [resolvedTargetPath];
  }
}
