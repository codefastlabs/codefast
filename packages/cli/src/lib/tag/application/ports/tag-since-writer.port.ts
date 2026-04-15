import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import type { TagFileResult } from "#lib/tag/domain/types.domain";

export interface TagSinceWriterPort {
  applySinceTagsToFile(filePath: string, version: string, fs: CliFs, write: boolean): TagFileResult;
}
