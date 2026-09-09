import type { PlannedSimplifyEdit } from "#/arrange/domain/ast/simplify-targets";
import { collectSimplifyTargets } from "#/arrange/domain/ast/simplify-targets";
import { dropCnImportIfUnused } from "#/arrange/domain/imports";
import type { GroupFileResult } from "#/arrange/domain/types";
import { collectClassNameFoldTargets } from "#/arrange/simplify/fold-targets";
import type { FileClassNameProbe, VariantClassNameProbe } from "#/arrange/simplify/variant-classname-probe";
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
    readonly probe?: VariantClassNameProbe | null;
  },
): GroupFileResult {
  const { filePath, write, probe } = args;
  const sourceText = fs.readFileSync(filePath, "utf8");
  const domainSf = parseDomainSourceFile(filePath, sourceText);

  // Resolve the file's type-server project at most once, and only if a syntactic fold candidate needs it.
  let resolvedFileProbe: FileClassNameProbe | null | undefined;
  const resolveFileProbe = (): FileClassNameProbe | null => {
    resolvedFileProbe ??= probe ? probe.forFile(filePath) : null;
    return resolvedFileProbe;
  };

  // Fold edits replace a whole cn() call, so they take precedence over any base edit on the same call.
  const foldEdits = probe ? collectClassNameFoldTargets(domainSf, resolveFileProbe) : [];
  const baseEdits = collectSimplifyTargets(domainSf).filter(
    (edit) => !foldEdits.some((fold) => editsOverlap(edit, fold)),
  );
  const edits = [...foldEdits, ...baseEdits];

  const meaningful = edits.filter((edit) => sourceText.slice(edit.start, edit.end) !== edit.replacement);

  // Apply class-simplification edits first, then prune any cn import that
  // became (or was already) unused. With no edits the text is unchanged, so the
  // already-parsed tree is reused rather than parsing every untouched file twice.
  const textAfterEdits = meaningful.length > 0 ? applyEditsDescending(sourceText, meaningful) : sourceText;
  const domainSfAfterEdits = meaningful.length > 0 ? parseDomainSourceFile(filePath, textAfterEdits) : domainSf;

  const textAfterImportDrop = dropCnImportIfUnused(domainSfAfterEdits);

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
