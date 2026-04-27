import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { TagSinceWriterPort } from "#/lib/tag/application/ports/tag-since-writer.port";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";
import type { TagVersionResolverPort } from "#/lib/tag/application/ports/tag-version-resolver.port";
import type { PresentTagSyncResultPresenter } from "#/lib/tag/contracts/presentation.contract";
import type { TagProgressListener } from "#/lib/tag/domain/types.domain";
import type { PrepareTagSyncUseCase } from "#/lib/tag/application/use-cases/prepare-tag-sync.use-case";
import type { RunTagSyncUseCase } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";

export const TagTargetResolverPortToken: Token<TagTargetResolverPort> =
  token<TagTargetResolverPort>("TagTargetResolverPort");
export const TypeScriptTreeWalkPortToken: Token<TypeScriptTreeWalkPort> =
  token<TypeScriptTreeWalkPort>("TypeScriptTreeWalkPort");
export const TagSinceWriterPortToken: Token<TagSinceWriterPort> =
  token<TagSinceWriterPort>("TagSinceWriterPort");
export const TagVersionResolverPortToken: Token<TagVersionResolverPort> =
  token<TagVersionResolverPort>("TagVersionResolverPort");

export const RunTagSyncUseCaseToken: Token<RunTagSyncUseCase> =
  token<RunTagSyncUseCase>("RunTagSyncUseCase");
export const PrepareTagSyncUseCaseToken: Token<PrepareTagSyncUseCase> =
  token<PrepareTagSyncUseCase>("PrepareTagSyncUseCase");
export const PresentTagSyncResultPresenterToken: Token<PresentTagSyncResultPresenter> =
  token<PresentTagSyncResultPresenter>("PresentTagSyncResultPresenter");
export const TagSyncProgressListenerToken: Token<TagProgressListener> =
  token<TagProgressListener>("TagSyncProgressListener");
