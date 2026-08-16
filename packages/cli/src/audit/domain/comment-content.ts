/**
 * Recognises comment content the repo bans outright: repo-document pointers and JSDoc type syntax.
 */

/**
 * Why a comment's content fails the convention. Neither is mechanical — the writer must restate
 * the invariant (pointer) or let the type carry the type (JSDoc).
 */
export type CommentContentDefectKind = "doc-pointer" | "jsdoc-type";

/**
 * One banned fragment found inside a comment.
 */
export interface CommentContentFinding {
  readonly line: number;
  readonly raw: string;
  readonly defect: CommentContentDefectKind;
}

// "see <anything>.md" — a pointer at a repo document. A bare .md mention is allowed: code that
// generates a markdown file legitimately names its own output.
const docPointerPattern = /\bsee\b[^\n]*?[\w./-]+\.md\b/i;
// The classic JSDoc `{type}` payload TSDoc drops — TS already declares the type.
const jsdocTypePattern = /@(?:param|returns?|type|prop(?:erty)?)\s*\{/;
const lineCommentPattern = /^[ \t]*\/\//;
const blockLinePattern = /^[ \t]*(?:\/\*|\*)/;

/**
 * Scans a source file's comments for banned content, in source order.
 */
export function scanCommentContent(content: string, language: "css" | "js"): Array<CommentContentFinding> {
  const findings: Array<CommentContentFinding> = [];
  const lines = content.split(/\r?\n/);
  let insideBlock = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const trimmed = line.trim();
    // Only a line-leading `/*` opens a block — a marker inside code or a string literal does not.
    const opensBlock = trimmed.startsWith("/*") && !trimmed.includes("*/");
    const isComment =
      insideBlock ||
      opensBlock ||
      (language === "js" ? lineCommentPattern.test(line) || blockLinePattern.test(line) : trimmed.startsWith("/*"));
    if (opensBlock) {
      insideBlock = true;
    }
    if (insideBlock && trimmed.includes("*/")) {
      insideBlock = false;
    }
    if (!isComment) {
      continue;
    }

    const pointer = docPointerPattern.exec(line);
    if (pointer !== null) {
      findings.push({ line: index + 1, raw: pointer[0].trim(), defect: "doc-pointer" });
    }
    const jsdoc = jsdocTypePattern.exec(line);
    if (jsdoc !== null) {
      findings.push({ line: index + 1, raw: trimmed.slice(0, 80), defect: "jsdoc-type" });
    }
  }

  return findings;
}
