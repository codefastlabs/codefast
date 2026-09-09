import type { PlannedSimplifyEdit } from "#/arrange/domain/ast/simplify-targets";
import { collectSimplifyTargets } from "#/arrange/domain/ast/simplify-targets";
import { dropCnImportIfUnused } from "#/arrange/domain/imports";
import type { GroupFileResult } from "#/arrange/domain/types";
import { collectClassNameFoldTargets } from "#/arrange/simplify/fold-targets";
import type { FileClassNameProbe } from "#/arrange/simplify/variant-classname-probe";
import { parseDomainSourceFile } from "#/arrange/source-parse";
import type { Filesystem } from "#/core/filesystem/filesystem";
import { applyEditsDescending } from "#/core/source-text-edit";

/** True when two planned edits touch overlapping source ranges. */
function editsOverlap(left: PlannedSimplifyEdit, right: PlannedSimplifyEdit): boolean {
  return left.start < right.end && right.start < left.end;
}

/**
 * Runs the simplify pass on one file — flattening class expressions and pruning an unused `cn` import.
 *
 * @since 0.3.16-canary.0
 */
export function processArrangeSimplifyFile(
  fs: Filesystem,
  args: {
    readonly filePath: string;
    readonly write: boolean;
    readonly fileProbe?: FileClassNameProbe | null;
  },
): GroupFileResult {
  const { filePath, write, fileProbe } = args;
  const sourceText = fs.readFileSync(filePath, "utf8");
  const domainSf = parseDomainSourceFile(filePath, sourceText);

  // Fold edits replace a whole cn() call, so they take precedence over any base edit on the same call.
  const foldEdits = fileProbe ? collectClassNameFoldTargets(domainSf, fileProbe) : [];
  const baseEdits = collectSimplifyTargets(domainSf).filter(
    (edit) => !foldEdits.some((fold) => editsOverlap(edit, fold)),
  );
  const edits = [...foldEdits, ...baseEdits];

  const meaningful = edits.filter((edit) => sourceText.slice(edit.start, edit.end) !== edit.replacement);

  // Apply class-simplification edits first, then prune any cn import that
  // became (or was already) unused.
  const textAfterEdits = meaningful.length > 0 ? applyEditsDescending(sourceText, meaningful) : sourceText;

  const textAfterImportDrop = dropCnImportIfUnused(parseDomainSourceFile(filePath, textAfterEdits));

  const importDropped = textAfterImportDrop !== textAfterEdits;
  const totalFound = meaningful.length + (importDropped ? 1 : 0);

  if (totalFound === 0) {
    return { filePath, totalFound: 0, changed: 0 };
  }

  if (!write) {
    return { filePath, totalFound, changed: 0 };
  }

  fs.writeFileSync(filePath, textAfterImportDrop, "utf8");

  return { filePath, totalFound, changed: totalFound };
}
