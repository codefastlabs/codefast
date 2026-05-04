import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#/arrange/domain/analyze-service";
import type { AnalyzeReport } from "#/arrange/domain/types";
import { scanArrangeTargets } from "#/arrange/scan-target";
import { parseDomainSourceFile } from "#/arrange/source-parse";

/**
 * @since 0.3.16-canary.0
 */
export function analyzeDirectory(
  fs: FilesystemPort,
  analyzeRootPath: string,
): Result<AnalyzeReport, AppError> {
  const report = createEmptyAnalyzeReport();
  try {
    const files = scanArrangeTargets(fs, analyzeRootPath);
    for (const filePath of files) {
      const sourceText = fs.readFileSync(filePath, "utf8");
      const domainSf = parseDomainSourceFile(filePath, sourceText);
      accumulateAnalyzeReportForSourceFile(report, domainSf, sourceText, filePath);
    }
    return ok(report);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
