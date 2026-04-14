import type { TagTargetResolverPort } from "#lib/tag/application/ports/target-resolver.port";
import { resolveTagTargetCandidates } from "#lib/tag/infra/target-resolver";

export const tagTargetResolverAdapter: TagTargetResolverPort = {
  resolveTagTargetCandidates,
};
