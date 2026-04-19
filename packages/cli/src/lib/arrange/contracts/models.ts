import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

export type ArrangeSuggestGroupsOutput = {
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
};

export type ArrangeTargetWorkspaceAndConfig = {
  readonly resolvedTarget: string;
  readonly rootDir: string;
  readonly config: CodefastConfig;
};
