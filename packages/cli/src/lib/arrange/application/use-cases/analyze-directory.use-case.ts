import { inject, injectable } from "@codefast/di";
import {
  ArrangeTargetScannerServiceToken,
  DomainSourceParserPortToken,
} from "#/lib/arrange/contracts/tokens";
import type { ArrangeTargetScannerService } from "#/lib/arrange/contracts/services.contract";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import { messageFromCaughtUnknown } from "#/lib/core/domain/caught-unknown-message.value-object";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { ArrangeAnalyzeDirectoryRequest } from "#/lib/arrange/application/requests/analyze-directory.request";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#/lib/arrange/domain/arrange-analyze.service";

export interface AnalyzeDirectoryUseCase {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
}

@injectable([
  inject(CliFsToken),
  inject(ArrangeTargetScannerServiceToken),
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
      });

      for (const filePath of files) {
        const sourceText = this.fs.readFileSync(filePath, "utf8");
        const domainSf = this.domainSourceParser.parseDomainSourceFile(filePath, sourceText);
        accumulateAnalyzeReportForSourceFile(report, domainSf, sourceText, filePath);
      }

      return ok(report);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }
}
