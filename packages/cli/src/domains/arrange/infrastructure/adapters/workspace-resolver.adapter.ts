import { inject, injectable } from "@codefast/di";
import { findRepoRoot } from "#/shell/infrastructure/workspace/repo-root-resolver.service";
import type { WorkspaceResolverPort } from "#/domains/arrange/application/ports/workspace-resolver.port";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliFsToken)])
export class WorkspaceResolverAdapter implements WorkspaceResolverPort {
  constructor(private readonly fs: CliFs) {}

  findRepoRoot(fromDirectory: string): string {
    return findRepoRoot(this.fs, fromDirectory);
  }
}
