import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import { findRepoRoot } from "#/lib/infrastructure/workspace/repo-root.adapter";

@injectable([inject(CliFsToken)])
export class RepoRootResolverAdapter implements RepoRootResolverPort {
  constructor(private readonly fs: CliFs) {}

  findRepoRoot(fromDirectory: string): string {
    return findRepoRoot(this.fs, fromDirectory);
  }
}
