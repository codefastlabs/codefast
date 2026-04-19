import type { ArrangeGroupFileOptions, GroupFileResult } from "#/lib/arrange/domain/types.domain";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

export interface ArrangeTargetScannerService {
  scanTarget(args: { readonly targetPath: string; readonly fs: CliFs }): string[];
}

export interface ArrangeFileProcessorService {
  processFile(args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
  }): GroupFileResult;
}
