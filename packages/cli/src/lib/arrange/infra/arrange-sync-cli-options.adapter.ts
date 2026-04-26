import type { CodefastArrangeConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";

/**
 * CLI / container wiring: filesystem and logger injected at the boundary.
 */
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
