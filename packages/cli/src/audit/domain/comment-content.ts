/**
 * Recognises comment content the repo bans outright: repo-document pointers and JSDoc type syntax.
 */

/**
 * Why a comment's content fails the convention. None is mechanical — the writer restates the
 * invariant, lets the type carry the type, or moves the tag.
 */
export type CommentContentDefectKind =
  | "detached-doc"
  | "doc-pointer"
  | "jsdoc-type"
  | "param-coverage"
  | "param-hyphen"
  | "since-order"
  | "stacked-doc";

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
const docBlockClosePattern = /^[ \t]*(?:\*.*)?\*\/[ \t]*$/;
const paramTagPattern = /^\s*\*\s*@param\s+([\w.$]+)/;
const declarationPattern = /^[ \t]*(?:export|const|let|var|function|class|interface|type|enum|async|declare)\b/;
// A divider or a tooling directive above a doc block is not a stacked note.
const dividerLinePattern = /^[ \t]*\/\/[ \t]*[-=─_*~#]{2,}/;
const directiveLinePattern = /^[ \t]*\/\/[ \t]*(?:oxlint-|eslint-|@ts-|prettier-)/;

/**
 * Scans a source file's comments for banned content, in source order.
 */
export function scanCommentContent(content: string, language: "css" | "js"): Array<CommentContentFinding> {
  const findings: Array<CommentContentFinding> = [];
  const lines = content.split(/\r?\n/);
  let insideBlock = false;
  let pendingSinceLine = 0;
  let documentedParams: Array<string> = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const trimmed = line.trim();
    // Only a line-leading `/*` opens a block — a marker inside code or a string literal does not.
    const opensBlock = trimmed.startsWith("/*") && !trimmed.includes("*/");
    // A `//` run stacked directly above a doc block reads as a second doc — it belongs inside.
    if (language === "js" && !insideBlock && trimmed.startsWith("/**")) {
      let runStart = index;
      while (
        runStart > 0 &&
        lineCommentPattern.test(lines[runStart - 1]!) &&
        !dividerLinePattern.test(lines[runStart - 1]!) &&
        !directiveLinePattern.test(lines[runStart - 1]!)
      ) {
        runStart--;
      }
      if (runStart < index) {
        findings.push({ line: runStart + 1, raw: lines[runStart]!.trim().slice(0, 80), defect: "stacked-doc" });
      }
    }
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

    const paramTag = paramTagPattern.exec(line);
    if (insideBlock && paramTag !== null) {
      documentedParams.push(paramTag[1]!.split(".", 1)[0]!);
    }

    // A `//` run between a doc block and its declaration detaches the block from the symbol.
    if (language === "js" && docBlockClosePattern.test(line) && index + 1 < lines.length) {
      let cursor = index + 1;
      while (cursor < lines.length && lineCommentPattern.test(lines[cursor]!)) {
        cursor++;
      }
      if (cursor > index + 1 && cursor < lines.length && declarationPattern.test(lines[cursor]!)) {
        findings.push({ line: index + 2, raw: lines[index + 1]!.trim().slice(0, 80), defect: "detached-doc" });
      }
      if (documentedParams.length > 0) {
        const missing = missingSignatureParams(lines, index + 1, documentedParams);
        if (missing.length > 0) {
          findings.push({ line: index + 1, raw: `@param missing: ${missing.join(", ")}`, defect: "param-coverage" });
        }
      }
      documentedParams = [];
    }
  }

  return findings;
}

// A partial list reads as a complete one, so a block naming any parameter must name them all.
function missingSignatureParams(lines: Array<string>, startIndex: number, documented: Array<string>): Array<string> {
  // gather the declaration text up to a balanced top-level `(...)` group
  let text = "";
  let sawOpen = false;
  let depth = 0;
  for (let index = startIndex; index < Math.min(lines.length, startIndex + 40); index++) {
    for (const ch of lines[index]!) {
      if (ch === "(") {
        depth++;
        sawOpen = true;
        if (depth === 1) {
          continue;
        }
      } else if (ch === ")") {
        depth--;
      }
      if (sawOpen && depth > 0) {
        text += ch;
      }
      if (sawOpen && depth === 0) {
        return compareParams(text, documented);
      }
    }
    if (sawOpen) {
      text += "\n";
    }
  }
  return [];
}

function compareParams(parameterListText: string, documented: Array<string>): Array<string> {
  const entries: Array<string> = [];
  let depth = 0;
  let current = "";
  for (const ch of parameterListText) {
    if ("([{<".includes(ch)) {
      depth++;
    } else if (")]}>".includes(ch)) {
      depth--;
    }
    if (ch === "," && depth === 0) {
      entries.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) {
    entries.push(current);
  }

  const missing: Array<string> = [];
  for (const entry of entries) {
    const cleaned = entry.trim().replace(/^\.{3}/, "");
    // A wrapper call or a destructured parameter cannot be matched by name — skip, never guess.
    if (cleaned.startsWith("(")) {
      return [];
    }
    if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
      continue;
    }
    const name = /^(?:readonly\s+)?([\w$]+)/.exec(cleaned)?.[1];
    if (name === undefined || name === "this") {
      continue;
    }
    if (!documented.includes(name)) {
      missing.push(name);
    }
  }
  return missing;
}
