import { token } from "@codefast/di";
import type { TagSinceWriterPort } from "#/domains/tag/application/outbound/tag-since-writer.outbound-port";
import type { TagTargetResolverPort } from "#/domains/tag/application/outbound/target-resolver.outbound-port";
import type { TagVersionResolverPort } from "#/domains/tag/application/outbound/tag-version-resolver.outbound-port";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/inbound/prepare-tag-sync.use-case";
import type { RunTagSyncUseCase } from "#/domains/tag/application/inbound/run-tag-sync.use-case";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/contracts/tag-sync-result-presenter.contract";
import type {
  TagCliTargetPathResolverService,
  TagTargetRunnerService,
} from "#/domains/tag/contracts/services.contract";
import type { TagProgressListener } from "#/domains/tag/domain/types.domain";

export const TagTargetResolverPortToken = token<TagTargetResolverPort>("TagTargetResolverPort");
export const TagSinceWriterPortToken = token<TagSinceWriterPort>("TagSinceWriterPort");
export const TagVersionResolverPortToken = token<TagVersionResolverPort>("TagVersionResolverPort");

export const RunTagSyncUseCaseToken = token<RunTagSyncUseCase>("RunTagSyncUseCase");
export const PrepareTagSyncUseCaseToken = token<PrepareTagSyncUseCase>("PrepareTagSyncUseCase");

export const TagTargetRunnerServiceToken = token<TagTargetRunnerService>("TagTargetRunnerService");
export const TagCliTargetPathResolverServiceToken = token<TagCliTargetPathResolverService>(
  "TagCliTargetPathResolverService",
);

export const PresentTagSyncResultPresenterToken = token<PresentTagSyncResultPresenter>(
  "PresentTagSyncResultPresenter",
);
export const TagSyncProgressListenerToken = token<TagProgressListener>("TagSyncProgressListener");
