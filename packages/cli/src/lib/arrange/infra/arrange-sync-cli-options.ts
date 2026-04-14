import type { CodefastArrangeConfig } from "#lib/config";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";

/** CLI / container wiring: filesystem and logger injected at the boundary. */
export type ArrangeSyncOptions = {
  rootDir: string;
  config?: CodefastArrangeConfig;
  targetPath: string;
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
  fs: CliFs;
  logger: CliLogger;
};
