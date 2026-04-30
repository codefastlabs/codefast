import type { CodefastConfig } from "#/domains/config/domain/schema.domain";
import type { GlobalCliOptions } from "#/shell/application/services/global-cli-options-parser.service";

export interface MirrorSyncCommandPrelude {
  readonly globals: GlobalCliOptions;
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly packageFilter: string | undefined;
}
