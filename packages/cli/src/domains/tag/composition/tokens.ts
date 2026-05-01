import { token } from "@codefast/di";
import type { TagSinceWriterPort } from "#/domains/tag/application/ports/outbound/tag-since-writer.port";
import type { TagVersionResolverPort } from "#/domains/tag/application/ports/outbound/tag-version-resolver.port";
import type { TagEligibleWorkspacePathsPort } from "#/domains/tag/application/ports/outbound/tag-eligible-workspace-paths.port";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.port";
import type { RunTagSyncUseCase } from "#/domains/tag/application/ports/inbound/run-tag-sync.port";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.port";
import type { TagTargetPathResolverPort } from "#/domains/tag/application/ports/outbound/tag-target-path-resolver.port";
import type { TagTargetRunnerPort } from "#/domains/tag/application/ports/outbound/tag-target-runner.port";
import type { TagProgressListener } from "#/domains/tag/domain/types.domain";

export const TagEligibleWorkspacePathsPortToken = token<TagEligibleWorkspacePathsPort>(
  "TagEligibleWorkspacePathsPort",
);

export const TagSinceWriterPortToken = token<TagSinceWriterPort>("TagSinceWriterPort");

export const TagVersionResolverPortToken = token<TagVersionResolverPort>("TagVersionResolverPort");

export const RunTagSyncUseCaseToken = token<RunTagSyncUseCase>("RunTagSyncUseCase");
export const PrepareTagSyncUseCaseToken = token<PrepareTagSyncUseCase>("PrepareTagSyncUseCase");

export const TagTargetRunnerPortToken = token<TagTargetRunnerPort>("TagTargetRunnerPort");

export const TagTargetPathResolverPortToken = token<TagTargetPathResolverPort>(
  "TagTargetPathResolverPort",
);

export const PresentTagSyncResultPresenterToken = token<PresentTagSyncResultPresenter>(
  "PresentTagSyncResultPresenter",
);

export const TagSyncProgressListenerToken = token<TagProgressListener>("TagSyncProgressListener");
