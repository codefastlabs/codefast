import { token } from "@codefast/di";
import type { TagSinceWriterPort } from "#/domains/tag/application/ports/tag-since-writer.port";
import type { TagTargetResolverPort } from "#/domains/tag/application/ports/target-resolver.port";
import type { TypeScriptTreeWalkPort } from "#/domains/tag/application/ports/typescript-tree-walk.port";
import type { TagVersionResolverPort } from "#/domains/tag/application/ports/tag-version-resolver.port";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/use-cases/prepare-tag-sync.use-case";
import type { RunTagSyncUseCase } from "#/domains/tag/application/use-cases/run-tag-sync.use-case";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/contracts/tag-sync-result-presenter.contract";
import type {
  TagCliTargetPathResolverService,
  TagTargetRunnerService,
} from "#/domains/tag/contracts/services.contract";
import type { TagProgressListener } from "#/domains/tag/domain/types.domain";

export const TagTargetResolverPortToken = token<TagTargetResolverPort>("TagTargetResolverPort");
export const TypeScriptTreeWalkPortToken = token<TypeScriptTreeWalkPort>("TypeScriptTreeWalkPort");
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
