import type { FilesystemPort } from "#/core/filesystem";
import type { ArrangeGroupFileOptions, GroupFileResult } from "#/arrange/domain/types.domain";
import {
  buildGroupFileUnwrapState,
  countPersistedGroupFileEdits,
  groupFileDryRunNoEdits,
  groupFileEditsTouchJsxCn,
  groupFilePreviewTotals,
  groupFileWorkHasNothingToReport,
  mergeGroupFileBodyText,
  tryBuildGroupFileWorkPlan,
} from "#/arrange/domain/arrange-grouping.domain-service";
import { ensureCnImport } from "#/arrange/domain/imports.domain";
import { parseDomainSourceFile } from "#/arrange/source-parse";

export function processArrangeGroupFile(
  fs: FilesystemPort,
  args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
  },
): GroupFileResult {
  const { filePath, options } = args;
  const sourceText = fs.readFileSync(filePath, "utf8");
  const domainSfInitial = parseDomainSourceFile(filePath, sourceText);
  const unwrap = buildGroupFileUnwrapState(domainSfInitial, sourceText);
  const domainSfGrouped = parseDomainSourceFile(filePath, unwrap.textAfterUnwrap);

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
      newText = ensureCnImport(parseDomainSourceFile(filePath, newText), options.cnImport);
    }
    fs.writeFileSync(filePath, newText, "utf8");
  }

  return {
    filePath,
    totalFound: persistedEditCount + work.cnInTvNoReplacement,
    changed: persistedEditCount,
  };
}
