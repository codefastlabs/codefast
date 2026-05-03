import { SubprocessExecutionError } from "#/subprocess/run-bench-subprocess";

export function resolveBenchParentExitCode(candidate: unknown): number {
  if (candidate instanceof SubprocessExecutionError) {
    return candidate.exitCode ?? 1;
  }
  return 1;
}
