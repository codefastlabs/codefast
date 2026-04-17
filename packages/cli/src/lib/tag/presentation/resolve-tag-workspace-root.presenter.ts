import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";

export type ResolveTagWorkspaceRootPathInput = {
  readonly resolveStrictRepoRoot: () => string;
  readonly logger: CliLogger;
  readonly currentWorkingDirectory: string;
};

export function resolveTagWorkspaceRootPath(input: ResolveTagWorkspaceRootPathInput): string {
  try {
    return input.resolveStrictRepoRoot();
  } catch (caughtRepoRootError: unknown) {
    input.logger.out(
      `[tag] workspace root auto-detection failed (${messageFromCaughtUnknown(caughtRepoRootError)}), using cwd=${input.currentWorkingDirectory}`,
    );
    return input.currentWorkingDirectory;
  }
}
