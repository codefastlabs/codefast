import { inject, injectable } from "@codefast/di";
import { RepoRootResolverPortToken } from "#/shell/application/cli-runtime.tokens";
import type { RepoRootResolverPort } from "#/shell/application/ports/repo-root-resolver.port";
import type { WorkspaceResolverPort } from "#/domains/arrange/application/ports/workspace-resolver.port";

@injectable([inject(RepoRootResolverPortToken)])
export class WorkspaceResolverAdapter implements WorkspaceResolverPort {
  constructor(private readonly repoRootResolver: RepoRootResolverPort) {}

  findRepoRoot(fromDirectory: string): string {
    return this.repoRootResolver.findRepoRoot(fromDirectory);
  }
}
