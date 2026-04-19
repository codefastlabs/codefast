import { injectable } from "@codefast/di";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import { resolveTagTargetCandidates } from "#/lib/tag/infra/tag-target-candidates.adapter";

@injectable([])
export class TagTargetResolverAdapter implements TagTargetResolverPort {
  resolveTagTargetCandidates = resolveTagTargetCandidates;
}
