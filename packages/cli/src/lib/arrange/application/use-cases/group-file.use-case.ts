import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import type { DomainSourceParserPort } from "#lib/arrange/application/ports/domain-source-parser.port";
import { printGroupFilePreviewFromWork } from "#lib/arrange/application/use-cases/group-file-preview.use-case";
import type { ArrangeGroupFileOptions, GroupFileResult } from "#lib/arrange/domain/types.domain";
import {
  buildGroupFileUnwrapState,
  countPersistedGroupFileEdits,
  groupFileDryRunNoEdits,
  groupFileEditsTouchJsxCn,
  groupFilePreviewTotals,
  groupFileWorkHasNothingToReport,
  mergeGroupFileBodyText,
  tryBuildGroupFileWorkPlan,
} from "#lib/arrange/domain/arrange-grouping.service";
import { ensureCnImport } from "#lib/arrange/domain/imports.domain";

export function groupFile(
  filePath: string,
  options: ArrangeGroupFileOptions,
  fs: CliFs,
  logger: CliLogger,
  domainSourceParser: DomainSourceParserPort,
): GroupFileResult {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const domainSfInitial = domainSourceParser.parseDomainSourceFile(filePath, sourceText);
  const unwrap = buildGroupFileUnwrapState(domainSfInitial, sourceText);
  const domainSfGrouped = domainSourceParser.parseDomainSourceFile(
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
    printGroupFilePreviewFromWork(logger, work);
    return groupFilePreviewTotals(work);
  }

  const persistedEditCount = countPersistedGroupFileEdits(work);
  let newText = mergeGroupFileBodyText(work);

  if (persistedEditCount > 0) {
    if (groupFileEditsTouchJsxCn(work)) {
      newText = ensureCnImport(
        domainSourceParser.parseDomainSourceFile(filePath, newText),
        options.cnImport,
      );
    }
    fs.writeFileSync(filePath, newText, "utf8");
  }

  return {
    filePath,
    totalFound: persistedEditCount + work.cnInTvNoReplacement,
    changed: persistedEditCount,
  };
}
