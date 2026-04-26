import { inject, injectable } from "@codefast/di";
import { DomainSourceParserPortToken } from "#/lib/arrange/contracts/tokens";
import type { ArrangeFileProcessorService } from "#/lib/arrange/contracts/services.contract";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { ArrangeGroupFileOptions, GroupFileResult } from "#/lib/arrange/domain/types.domain";
import {
  buildGroupFileUnwrapState,
  countPersistedGroupFileEdits,
  groupFileDryRunNoEdits,
  groupFileEditsTouchJsxCn,
  groupFilePreviewTotals,
  groupFileWorkHasNothingToReport,
  mergeGroupFileBodyText,
  tryBuildGroupFileWorkPlan,
} from "#/lib/arrange/domain/arrange-grouping.service";
import { ensureCnImport } from "#/lib/arrange/domain/imports.domain";

@injectable([inject(CliFsToken), inject(DomainSourceParserPortToken)])
export class ArrangeFileProcessorServiceImpl implements ArrangeFileProcessorService {
  constructor(
    private readonly fs: CliFs,
    private readonly domainSourceParser: DomainSourceParserPort,
  ) {}

  processFile(args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
  }): GroupFileResult {
    const { filePath, options } = args;
    const sourceText = this.fs.readFileSync(filePath, "utf8");
    const domainSfInitial = this.domainSourceParser.parseDomainSourceFile(filePath, sourceText);
    const unwrap = buildGroupFileUnwrapState(domainSfInitial, sourceText);
    const domainSfGrouped = this.domainSourceParser.parseDomainSourceFile(
      filePath,
      unwrap.textAfterUnwrap,
    );

    const work = tryBuildGroupFileWorkPlan({
      filePath,
      sourceText,
      domainSfInitial,
      domainSfGrouped,
      withClassName: options.withClassName,
      unwrap,
    });

    if (work === null) {
      return groupFileDryRunNoEdits(filePath);
    }

    if (!options.write) {
      if (groupFileWorkHasNothingToReport(work)) {
        return groupFileDryRunNoEdits(filePath);
      }
      return { ...groupFilePreviewTotals(work), workPlan: work };
    }

    const persistedEditCount = countPersistedGroupFileEdits(work);
    let newText = mergeGroupFileBodyText(work);

    if (persistedEditCount > 0) {
      if (groupFileEditsTouchJsxCn(work)) {
        newText = ensureCnImport(
          this.domainSourceParser.parseDomainSourceFile(filePath, newText),
          options.cnImport,
        );
      }
      this.fs.writeFileSync(filePath, newText, "utf8");
    }

    return {
      filePath,
      totalFound: persistedEditCount + work.cnInTvNoReplacement,
      changed: persistedEditCount,
    };
  }
}
