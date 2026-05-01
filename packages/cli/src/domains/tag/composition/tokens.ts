import { token } from "@codefast/di";
import type { TagSinceWriterPort } from "#/domains/tag/application/ports/outbound/tag-since-writer.port";
import type { TagVersionResolverPort } from "#/domains/tag/application/ports/outbound/tag-version-resolver.port";
import type { TagEligibleWorkspacePathsPort } from "#/domains/tag/application/ports/outbound/tag-eligible-workspace-paths.port";
import type { PrepareTagSyncUseCasePort } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.use-case";
import type { RunTagSyncUseCasePort } from "#/domains/tag/application/ports/inbound/run-tag-sync.use-case";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.presenter";
import type { TagTargetPathResolverPort } from "#/domains/tag/application/ports/outbound/tag-target-path-resolver.port";
import type { TagTargetRunnerPort } from "#/domains/tag/application/ports/outbound/tag-target-runner.port";
import type { PresentTagSyncProgressPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-progress.presenter";

export const TagEligibleWorkspacePathsPortToken = token<TagEligibleWorkspacePathsPort>(
  "TagEligibleWorkspacePathsPort",
);

export const TagSinceWriterPortToken = token<TagSinceWriterPort>("TagSinceWriterPort");

export const TagVersionResolverPortToken = token<TagVersionResolverPort>("TagVersionResolverPort");

export const RunTagSyncUseCaseToken = token<RunTagSyncUseCasePort>("RunTagSyncUseCase");
export const PrepareTagSyncUseCaseToken = token<PrepareTagSyncUseCasePort>("PrepareTagSyncUseCase");

export const TagTargetRunnerPortToken = token<TagTargetRunnerPort>("TagTargetRunnerPort");

export const TagTargetPathResolverPortToken = token<TagTargetPathResolverPort>(
  "TagTargetPathResolverPort",
);

export const PresentTagSyncResultPresenterToken = token<PresentTagSyncResultPresenter>(
  "PresentTagSyncResultPresenter",
);

export const PresentTagSyncProgressPresenterToken = token<PresentTagSyncProgressPresenter>(
  "PresentTagSyncProgressPresenter",
);
