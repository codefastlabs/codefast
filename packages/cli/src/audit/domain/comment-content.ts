/**
 * Recognises comment content the repo bans outright: repo-document pointers and JSDoc type syntax.
 */

/**
 * Why a comment's content fails the convention. None is mechanical — the writer restates the
 * invariant, lets the type carry the type, or moves the tag.
 */
export type CommentContentDefectKind = "doc-pointer" | "jsdoc-type" | "param-hyphen" | "since-order";

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
// TSDoc separates the name from its description with a hyphen.
const paramNoHyphenPattern = /^\s*\*\s*@(?:param|typeParam)\s+[\w.$[\]]+\s+(?!-\s)\S/;
const blockTagPattern = /^\s*\*\s*@[a-z]/i;
const sinceTagPattern = /^\s*\*\s*@since\b/;
const lineCommentPattern = /^[ \t]*\/\//;
const blockLinePattern = /^[ \t]*(?:\/\*|\*)/;

/**
 * Scans a source file's comments for banned content, in source order.
 */
export function scanCommentContent(content: string, language: "css" | "js"): Array<CommentContentFinding> {
  const findings: Array<CommentContentFinding> = [];
  const lines = content.split(/\r?\n/);
  let insideBlock = false;
  let pendingSinceLine = 0;

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
      pendingSinceLine = 0;
    }
    if (!isComment) {
      continue;
    }

    const pointer = docPointerPattern.exec(line);
    if (pointer !== null) {
      findings.push({ line: index + 1, raw: pointer[0].trim(), defect: "doc-pointer" });
    }
    if (jsdocTypePattern.test(line)) {
      findings.push({ line: index + 1, raw: trimmed.slice(0, 80), defect: "jsdoc-type" });
    }
    if (paramNoHyphenPattern.test(line)) {
      findings.push({ line: index + 1, raw: trimmed.slice(0, 80), defect: "param-hyphen" });
    }
    // `@since` is stamped at release and stays the block's last tag; any tag after it is misplaced.
    if (insideBlock && sinceTagPattern.test(line)) {
      pendingSinceLine = index + 1;
    } else if (pendingSinceLine > 0 && blockTagPattern.test(line)) {
      findings.push({ line: pendingSinceLine, raw: trimmed.slice(0, 80), defect: "since-order" });
      pendingSinceLine = 0;
    }
  }

  return findings;
}
