import type { MirrorConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";

/**
 * CLI / container wiring: filesystem and logger injected at the boundary.
 */
export interface MirrorOptions {
  rootDir: string;
  config?: MirrorConfig;
  verbose?: boolean;
  noColor?: boolean;
  /**
   * Path under `rootDir` (relative or absolute within the repo), e.g. `packages/ui`.
   */
  packageFilter?: string;
  fs: CliFs;
  logger: CliLogger;
}
