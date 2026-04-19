import { inject, injectable } from "@codefast/di";
import type { PresentAnalyzeReportPresenter } from "#/lib/arrange/contracts/presentation.contract";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CliLoggerToken } from "#/lib/core/operational/contracts/tokens";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import { presentAnalyzeCliReport } from "#/lib/arrange/presentation/present-analyze-cli.presenter";

@injectable([inject(CliLoggerToken)])
export class PresentAnalyzeReportPresenterImpl implements PresentAnalyzeReportPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(resolvedTargetPath: string, report: AnalyzeReport): void {
    presentAnalyzeCliReport(this.logger, resolvedTargetPath, report);
  }
}
