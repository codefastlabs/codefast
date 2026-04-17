import type { CodefastTagConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs } from "#/lib/infra/fs-contract.port";
import type { TagProgressListener } from "#/lib/tag/domain/types.domain";

/** CLI / container wiring: filesystem injected at the boundary. */
export type TagSyncOptions = {
  rootDir: string;
  config?: CodefastTagConfig;
  skipPackages?: string[];
  targetPath?: string;
  write: boolean;
  fs: CliFs;
  listener?: TagProgressListener;
};
