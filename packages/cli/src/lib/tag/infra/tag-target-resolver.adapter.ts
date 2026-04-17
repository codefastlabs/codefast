import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import { resolveTagTargetCandidates } from "#/lib/tag/infra/tag-target-candidates.adapter";

export const tagTargetResolverAdapter: TagTargetResolverPort = {
  resolveTagTargetCandidates,
};
