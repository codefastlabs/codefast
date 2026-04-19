import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { TagSinceWriterPort } from "#/lib/tag/application/ports/tag-since-writer.port";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";
import type { TagVersionResolverPort } from "#/lib/tag/application/ports/tag-version-resolver.port";
import type {
  CreateTagProgressListenerPresenter,
  PrepareTagOrchestrator,
  PresentTagSyncResultPresenter,
} from "#/lib/tag/contracts/presentation.contract";
import type { RunTagSyncUseCase } from "#/lib/tag/contracts/use-cases.contract";

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
export const PrepareTagOrchestratorToken: Token<PrepareTagOrchestrator> =
  token<PrepareTagOrchestrator>("PrepareTagOrchestrator");
export const PresentTagSyncResultPresenterToken: Token<PresentTagSyncResultPresenter> =
  token<PresentTagSyncResultPresenter>("PresentTagSyncResultPresenter");
export const CreateTagProgressListenerPresenterToken: Token<CreateTagProgressListenerPresenter> =
  token<CreateTagProgressListenerPresenter>("CreateTagProgressListenerPresenter");
