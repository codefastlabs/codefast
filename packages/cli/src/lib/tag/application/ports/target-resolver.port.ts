import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import type { TagTargetCandidate } from "#lib/tag/domain/types";

export interface TagTargetResolverPort {
  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
    fileSystem: CliFs,
  ): Promise<TagTargetCandidate[]>;
}
