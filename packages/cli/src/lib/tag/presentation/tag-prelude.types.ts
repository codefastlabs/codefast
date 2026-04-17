import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

export type TagCommandPrelude = {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
};
