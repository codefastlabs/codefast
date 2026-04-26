import type { TagFileResult } from "#/lib/tag/domain/types.domain";

export interface TagSinceWriterPort {
  applySinceTagsToFile(filePath: string, version: string, write: boolean): TagFileResult;
}
