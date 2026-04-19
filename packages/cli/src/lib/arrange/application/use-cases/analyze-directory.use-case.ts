import { inject, injectable } from "@codefast/di";
import type { AppError } from "#/lib/core/domain/errors.domain";
import { appError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { ArrangeAnalyzeDirectoryRequest } from "#/lib/arrange/application/requests/analyze-directory.request";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#/lib/arrange/domain/arrange-analyze.service";
import {
  ArrangeTargetScannerToken,
  CliFsToken,
  DomainSourceParserPortToken,
  type ArrangeTargetScannerService,
  type AnalyzeDirectoryUseCase,
} from "#/lib/tokens";

/**
 * Orchestrates filesystem + parse ports, delegates analysis rules to the domain service.
 */
@injectable([
  inject(CliFsToken),
  inject(ArrangeTargetScannerToken),
  inject(DomainSourceParserPortToken),
])
export class AnalyzeDirectoryUseCaseImpl implements AnalyzeDirectoryUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly targetScanner: ArrangeTargetScannerService,
    private readonly domainSourceParser: DomainSourceParserPort,
  ) {}

  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError> {
    const report = createEmptyAnalyzeReport();
    try {
      const files = this.targetScanner.scanTarget({
        targetPath: request.analyzeRootPath,
        fs: this.fs,
      });

      for (const filePath of files) {
        const sourceText = this.fs.readFileSync(filePath, "utf8");
        const domainSf = this.domainSourceParser.parseDomainSourceFile(filePath, sourceText);
        accumulateAnalyzeReportForSourceFile(report, domainSf, sourceText, filePath);
      }

      return ok(report);
    } catch (caughtError: unknown) {
      return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }
}
