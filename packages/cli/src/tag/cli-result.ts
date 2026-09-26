import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";
import type { TagResult } from "#tag/domain/types";

/**
 * Maps a tag run's result to the process exit code.
 *
 * @remarks A blocked declaration fails the run: once its release ships unstamped, the only stamp a
 * later run can add names a version that did not introduce it.
 *
 * @since 0.3.16-canary.0
 */
export function exitCodeForTagResult(result: TagResult): number {
  if (result.selectedTargets.length === 0) {
    return CLI_EXIT_GENERAL_ERROR;
  }
  const hasRunErrors = result.targetResults.some((targetResult) => targetResult.runError !== null);
  const hasBlockedDeclarations = result.blockedDeclarations.length > 0;
  return hasRunErrors || hasBlockedDeclarations || result.hookError !== null
    ? CLI_EXIT_GENERAL_ERROR
    : CLI_EXIT_SUCCESS;
}

/**
 * Serializes a tag run's result as the `--json` output string.
 *
 * @since 0.11.0
 */
export function formatTagJsonOutput(result: TagResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: exitCodeForTagResult(result) === CLI_EXIT_SUCCESS,
    cwd: rootDir,
    result,
  });
}
