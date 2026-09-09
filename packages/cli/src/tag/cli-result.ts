import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import type { TagResult } from "#/tag/domain/types";

/**
 * Maps a tag run's result to the process exit code.
 *
 * @since 0.3.16-canary.0
 */
export function exitCodeForTagResult(result: TagResult): number {
  if (result.selectedTargets.length === 0) {
    return CLI_EXIT_GENERAL_ERROR;
  }
  const hasRunErrors = result.targetResults.some((targetResult) => targetResult.runError !== null);
  return hasRunErrors || result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Serializes a tag run's result as the `--json` output string.
 */
export function formatTagJsonOutput(result: TagResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.hookError === null,
    cwd: rootDir,
    result,
  });
}
