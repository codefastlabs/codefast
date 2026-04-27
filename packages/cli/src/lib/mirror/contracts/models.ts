import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { GlobalCliOptions } from "#/lib/core/application/parse-global-cli-options.util";

export interface MirrorSyncCommandPrelude {
  readonly globals: GlobalCliOptions;
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly packageFilter: string | undefined;
}
