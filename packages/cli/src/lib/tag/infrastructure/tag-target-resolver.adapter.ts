import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import type { TagTargetCandidate } from "#/lib/tag/domain/types.domain";
import { resolveTagTargetCandidates } from "#/lib/tag/infrastructure/tag-target-candidates.adapter";

@injectable([inject(CliFsToken)])
export class TagTargetResolverAdapter implements TagTargetResolverPort {
  constructor(private readonly fs: CliFs) {}

  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]> {
    return resolveTagTargetCandidates(rootDir, explicitTarget, this.fs);
  }
}
