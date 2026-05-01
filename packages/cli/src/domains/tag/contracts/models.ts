import type { CodefastConfig } from "#/domains/config/domain/schema.domain";

export interface TagCommandPrelude {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
}
