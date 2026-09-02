import { SubprocessExecutionError } from "#/parent/run-bench-subprocess";

/**
 * Resolves the parent's process exit code from a caught error, preserving a subprocess's own code.
 *
 * @since 0.3.16-canary.0
 */
export function resolveBenchParentExitCode(candidate: unknown): number {
  if (candidate instanceof SubprocessExecutionError) {
    return candidate.exitCode ?? 1;
  }
  return 1;
}
