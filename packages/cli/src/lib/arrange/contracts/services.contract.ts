import type { ArrangeGroupFileOptions, GroupFileResult } from "#/lib/arrange/domain/types.domain";

export interface ArrangeTargetScannerService {
  scanTarget(args: { readonly targetPath: string }): string[];
}

export interface ArrangeFileProcessorService {
  processFile(args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
  }): GroupFileResult;
}
