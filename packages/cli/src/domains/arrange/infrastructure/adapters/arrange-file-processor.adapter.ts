import { inject, injectable } from "@codefast/di";
import { DomainSourceParserPortToken } from "#/domains/arrange/composition/tokens";
import type { ArrangeFileProcessorPort } from "#/domains/arrange/application/ports/outbound/arrange-file-processor.port";
import type { FilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/outbound/domain-source-parser.port";
import type {
  ArrangeGroupFileOptions,
  GroupFileResult,
} from "#/domains/arrange/domain/types.domain";
import {
  buildGroupFileUnwrapState,
  countPersistedGroupFileEdits,
  groupFileDryRunNoEdits,
  groupFileEditsTouchJsxCn,
  groupFilePreviewTotals,
  groupFileWorkHasNothingToReport,
  mergeGroupFileBodyText,
  tryBuildGroupFileWorkPlan,
} from "#/domains/arrange/domain/arrange-grouping.domain-service";
import { ensureCnImport } from "#/domains/arrange/domain/imports.domain";

@injectable([inject(CliFilesystemPortToken), inject(DomainSourceParserPortToken)])
export class ArrangeFileProcessorAdapter implements ArrangeFileProcessorPort {
  constructor(
    private readonly fs: FilesystemPort,
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
