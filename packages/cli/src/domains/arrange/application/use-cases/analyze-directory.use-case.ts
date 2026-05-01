import { inject, injectable } from "@codefast/di";
import {
  ArrangeTargetScannerServiceToken,
  DomainSourceParserPortToken,
} from "#/domains/arrange/contracts/tokens";
import type { ArrangeTargetScannerService } from "#/domains/arrange/contracts/services.contract";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type { CliFs } from "#/shell/application/outbound/cli-io.outbound-port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { DomainSourceParserPort } from "#/domains/arrange/application/outbound/domain-source-parser.outbound-port";
import type { ArrangeAnalyzeDirectoryRequest } from "#/domains/arrange/application/requests/analyze-directory.request";
import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#/domains/arrange/domain/arrange-analyze.service";
import type { AnalyzeReport } from "#/domains/arrange/domain/types.domain";
import type { AnalyzeDirectoryUseCase } from "#/domains/arrange/application/inbound/analyze-directory.use-case";

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
