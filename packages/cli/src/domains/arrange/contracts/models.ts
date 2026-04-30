import type { CodefastConfig } from "#/domains/config/domain/schema.domain";

export type ArrangeSuggestGroupsOutput = {
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
};

export type ArrangeTargetWorkspaceAndConfig = {
  readonly resolvedTarget: string;
  readonly rootDir: string;
  readonly config: CodefastConfig;
};
