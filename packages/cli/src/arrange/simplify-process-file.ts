import { collectSimplifyTargets } from "#/arrange/domain/ast/simplify-targets";
import { dropCnImportIfUnused } from "#/arrange/domain/imports";
import type { GroupFileResult } from "#/arrange/domain/types";
import { parseDomainSourceFile } from "#/arrange/source-parse";
import type { FilesystemPort } from "#/core/filesystem/port";
import { applyEditsDescending } from "#/core/source-text-edit";

/**
 * @since 0.3.16-canary.0
 */
export function processArrangeSimplifyFile(
  fs: FilesystemPort,
  args: {
    readonly filePath: string;
    readonly write: boolean;
  },
): GroupFileResult {
  const { filePath, write } = args;
  const sourceText = fs.readFileSync(filePath, "utf8");
  const domainSf = parseDomainSourceFile(filePath, sourceText);
  const edits = collectSimplifyTargets(domainSf);

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
