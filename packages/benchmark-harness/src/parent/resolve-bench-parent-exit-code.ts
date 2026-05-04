import { SubprocessExecutionError } from "#/parent/run-bench-subprocess";

/**
 * @since 0.3.16-canary.0
 */
export function resolveBenchParentExitCode(candidate: unknown): number {
  if (candidate instanceof SubprocessExecutionError) {
    return candidate.exitCode ?? 1;
  }
  return 1;
}
