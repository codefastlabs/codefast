import type { CodefastTagConfig } from "#lib/config/domain/schema";
import type { CliFs } from "#lib/infra/fs-contract";
import type { TagProgressListener } from "#lib/tag/domain/types";

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
