import path from "node:path";
import { fileURLToPath } from "node:url";
import { inject, injectable } from "@codefast/di";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { RepoRootResolverPort } from "#/shell/application/ports/outbound/repo-root-resolver.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";

/**
 * Resolve the monorepo root (directory containing `pnpm-workspace.yaml`).
 * Tries the compiled package location first, then the provided `startDir`.
 */
@injectable([inject(CliFilesystemPortToken)])
export class RepoRootResolver implements RepoRootResolverPort {
  constructor(private readonly fs: CliFilesystemPort) {}

  findRepoRoot(fromDirectory: string): string {
    const candidates = [path.dirname(fileURLToPath(import.meta.url)), fromDirectory];

    for (const start of candidates) {
      let dir = path.resolve(start);
      for (;;) {
        if (this.fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
          return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
          break;
        }
        dir = parent;
      }
    }

    throw new Error(
      `Could not locate monorepo root (missing pnpm-workspace.yaml). Searched from: ${candidates.join(", ")}`,
    );
  }
}
