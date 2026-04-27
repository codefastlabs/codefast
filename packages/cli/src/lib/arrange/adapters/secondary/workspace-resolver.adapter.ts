import { inject, injectable } from "@codefast/di";
import { findRepoRoot } from "#/lib/infrastructure/workspace/repo-root.adapter";
import type { WorkspaceResolverPort } from "#/lib/arrange/application/ports/workspace-resolver.port";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";

@injectable([inject(CliFsToken)])
export class WorkspaceResolverAdapter implements WorkspaceResolverPort {
  constructor(private readonly fs: CliFs) {}

  findRepoRoot(fromDirectory: string): string {
    return findRepoRoot(this.fs, fromDirectory);
  }
}
