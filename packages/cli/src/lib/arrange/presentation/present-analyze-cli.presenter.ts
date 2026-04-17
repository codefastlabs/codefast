import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { printAnalyzeReport } from "#/lib/arrange/presentation/report.presenter";

export function presentAnalyzeCliReport(
  logger: CliLogger,
  resolvedTargetPath: string,
  report: Parameters<typeof printAnalyzeReport>[1],
): void {
  printAnalyzeReport(resolvedTargetPath, report, logger);
}
