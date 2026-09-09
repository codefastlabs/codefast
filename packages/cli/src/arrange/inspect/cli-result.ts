import type { AnalyzeReport } from "#/arrange/domain/types";

/**
 * Machine-readable `arrange inspect` report for `--json`.
 */
export function formatArrangeAnalyzeJsonOutput(analyzeRootPath: string, report: AnalyzeReport): string {
  return JSON.stringify({ schemaVersion: 1 as const, analyzeRootPath, report });
}
