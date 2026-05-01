import { inject, injectable } from "@codefast/di";
import type { ArrangeTargetScannerPort } from "#/domains/arrange/application/ports/outbound/arrange-target-scanner.port";
import { FileWalkerPortToken } from "#/domains/arrange/composition/tokens";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";
import { CliFilesystemPortToken, CliPathPortToken } from "#/shell/application/cli-runtime.tokens";
import type { FileWalkerPort } from "#/domains/arrange/application/ports/outbound/file-walker.port";

@injectable([inject(FileWalkerPortToken), inject(CliPathPortToken), inject(CliFilesystemPortToken)])
export class ArrangeTargetScannerServiceImpl implements ArrangeTargetScannerPort {
  constructor(
    private readonly fileWalker: FileWalkerPort,
    private readonly path: CliPathPort,
    private readonly fs: CliFilesystemPort,
  ) {}

  scanTarget(args: { readonly targetPath: string }): string[] {
    const resolvedTargetPath = this.path.resolve(args.targetPath);
    if (this.fs.statSync(resolvedTargetPath).isDirectory()) {
      return this.fileWalker.walkTypeScriptFiles(resolvedTargetPath);
    }
    return [resolvedTargetPath];
  }
}
