import type { TagFileResult } from "#/domains/tag/domain/types.domain";

export interface TagSinceWriterPort {
  applySinceTagsToFile(filePath: string, version: string, write: boolean): TagFileResult;
}
