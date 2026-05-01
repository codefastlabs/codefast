import { inject, injectable } from "@codefast/di";
import {
  ArrangeTargetScannerPortToken,
  DomainSourceParserPortToken,
} from "#/domains/arrange/composition/tokens";
import type { ArrangeTargetScannerPort } from "#/domains/arrange/application/ports/outbound/arrange-target-scanner.port";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/outbound/domain-source-parser.port";
import type { ArrangeAnalyzeDirectoryRequest } from "#/domains/arrange/application/requests/analyze-directory.request";
import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#/domains/arrange/domain/arrange-analyze.domain-service";
import type { AnalyzeReport } from "#/domains/arrange/domain/types.domain";
import type { AnalyzeDirectoryPort } from "#/domains/arrange/application/ports/inbound/analyze-directory.port";

@injectable([
  inject(CliFilesystemPortToken),
  inject(ArrangeTargetScannerPortToken),
  inject(DomainSourceParserPortToken),
])
export class AnalyzeDirectoryUseCase implements AnalyzeDirectoryPort {
  constructor(
    private readonly fs: CliFilesystemPort,
    private readonly targetScanner: ArrangeTargetScannerPort,
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
