import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { RepoRootResolverPort } from "#/shell/application/ports/repo-root-resolver.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import { findRepoRoot } from "#/shell/infrastructure/workspace/repo-root-resolver.service";

@injectable([inject(CliFsToken)])
export class RepoRootResolverAdapter implements RepoRootResolverPort {
  constructor(private readonly fs: CliFs) {}

  findRepoRoot(fromDirectory: string): string {
    return findRepoRoot(this.fs, fromDirectory);
  }
}
