import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

export type ArrangeTargetWorkspaceAndConfig = {
  readonly resolvedTarget: string;
  readonly rootDir: string;
  readonly config: CodefastConfig;
};
