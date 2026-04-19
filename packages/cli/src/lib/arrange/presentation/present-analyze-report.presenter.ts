import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import type { PresentAnalyzeReportPresenter } from "#/lib/tokens";
import { CliLoggerToken } from "#/lib/tokens";
import { presentAnalyzeCliReport } from "#/lib/arrange/presentation/present-analyze-cli.presenter";

@injectable([inject(CliLoggerToken)])
export class PresentAnalyzeReportPresenterImpl implements PresentAnalyzeReportPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(resolvedTargetPath: string, report: AnalyzeReport): void {
    presentAnalyzeCliReport(this.logger, resolvedTargetPath, report);
  }
}
