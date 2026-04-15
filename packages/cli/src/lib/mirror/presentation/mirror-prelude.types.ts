import type { CodefastConfig } from "#lib/config/domain/schema.domain";
import type { GlobalCliOptions } from "#lib/core/presentation/global-cli-options.presenter";

export type MirrorSyncCommandPrelude = {
  readonly globals: GlobalCliOptions;
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly packageFilter: string | undefined;
};
