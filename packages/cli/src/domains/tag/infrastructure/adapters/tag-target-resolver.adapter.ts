import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import type { TagTargetResolverPort } from "#/domains/tag/application/ports/target-resolver.port";
import type { TagTargetCandidate } from "#/domains/tag/domain/types.domain";
import { resolveTagTargetCandidates } from "#/domains/tag/infrastructure/adapters/tag-target-candidates.adapter";

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
