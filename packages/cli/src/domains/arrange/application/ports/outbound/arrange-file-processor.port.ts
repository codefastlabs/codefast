import type {
  ArrangeGroupFileOptions,
  GroupFileResult,
} from "#/domains/arrange/domain/types.domain";

export interface ArrangeFileProcessorPort {
  processFile(args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
  }): GroupFileResult;
}
