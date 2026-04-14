import { appError, type AppError } from "#lib/core/domain/errors";
import { err, ok, type Result } from "#lib/core/domain/result";
import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message";
import type { DomainSourceParserPort } from "#lib/arrange/application/ports/domain-source-parser.port";
import type { ArrangeAnalyzeDirectoryRequest } from "#lib/arrange/application/requests/analyze-directory.request";
import type { FileWalkerPort } from "#lib/arrange/application/ports/file-walker.port";
import type { AnalyzeReport } from "#lib/arrange/domain/types";
import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#lib/arrange/domain/arrange-analyze.service";

export type AnalyzeDirectoryDeps = {
  readonly fs: CliFs;
  readonly fileWalker: FileWalkerPort;
  readonly domainSourceParser: DomainSourceParserPort;
};

/**
 * Orchestrates filesystem + parse ports, delegates analysis rules to the domain service.
 */
export function analyzeDirectory(
  request: ArrangeAnalyzeDirectoryRequest,
  deps: AnalyzeDirectoryDeps,
): Result<AnalyzeReport, AppError> {
  const report = createEmptyAnalyzeReport();
  try {
    const files = deps.fs.statSync(request.analyzeRootPath).isDirectory()
      ? deps.fileWalker.walkTypeScriptFiles(request.analyzeRootPath, deps.fs)
      : [request.analyzeRootPath];

    for (const filePath of files) {
      const sourceText = deps.fs.readFileSync(filePath, "utf8");
      const domainSf = deps.domainSourceParser.parseDomainSourceFile(filePath, sourceText);
      accumulateAnalyzeReportForSourceFile(report, domainSf, sourceText, filePath);
    }

    return ok(report);
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
