/**
 * Recognises section dividers in source text and renders them in the one form the repo allows.
 */

/**
 * The column every divider's rule ends at — `oxfmt`'s `printWidth`, indentation included.
 *
 * @since 0.6.0
 */
export const DIVIDER_COLUMN = 120;

const RULE_GLYPH = "─";
const LEAD_GLYPHS = "──";
/** Every glyph a divider has historically been drawn with, so legacy forms are recognised too. */
const RULE_CHARACTER_CLASS = String.raw`[-=─_*~#]`;

const ruleOnlyLinePattern = new RegExp(
  String.raw`^(?<indent>[ \t]*)(?:\/\/|\/\*|\*)[ \t]*${RULE_CHARACTER_CLASS}{4,}[ \t]*(?:\*\/)?[ \t]*$`,
);
const titledLinePattern = new RegExp(
  String.raw`^(?<indent>[ \t]*)(?:\/\/|\/\*)[ \t]*${RULE_CHARACTER_CLASS}{2,}[ \t]+(?<title>.*?)[ \t]+${RULE_CHARACTER_CLASS}{2,}[ \t]*(?:\*\/)?[ \t]*$`,
);
const commentLinePattern = /^[ \t]*(?:\/\/|\/\*|\*)/;
const bareRuleClosePattern = new RegExp(String.raw`^[ \t]*${RULE_CHARACTER_CLASS}{4,}[ \t]*\*\/[ \t]*$`);
const rulesOnlyPattern = new RegExp(String.raw`^(?:${RULE_CHARACTER_CLASS}|[ \t])*$`);
const commentPrefixPattern = /^[ \t]*(?:\/\/|\/\*|\*)[ \t]?/;
const commentSuffixPattern = /[ \t]*\*\/[ \t]*$/;

/** A banner spanning more lines than this is prose that happens to start with a rule, not a divider. */
const MAX_BANNER_SPAN = 16;
/** Past this a banner's lone line is a sentence the writer wanted kept, not a section name. */
const MAX_TITLE_LENGTH = 60;

/**
 * Which comment syntax a divider is written in.
 *
 * @since 0.6.0
 */
export type DividerLanguage = "css" | "js";

/**
 * Why a divider fails the convention. Both kinds are mechanical, so every report is one `--fix` away.
 *
 * @since 0.6.0
 */
export type DividerDefectKind = "bad-width" | "legacy-form";

/**
 * One divider found in a file, with the verdict on its form.
 *
 * @since 0.6.0
 */
export interface DividerRegion {
  readonly startLine: number;
  readonly endLine: number;
  readonly indent: string;
  readonly title: string;
  readonly raw: string;
  readonly defect: DividerDefectKind | null;
}

/**
 * Renders a divider in the canonical form.
 *
 * @param indent - leading whitespace copied from the site, counted toward the column
 * @param title - the section name, already trimmed
 * @param language - which comment syntax to draw the divider in
 *
 * @since 0.6.0
 */
export function renderDivider(indent: string, title: string, language: DividerLanguage): string {
  if (language === "css") {
    const head = `${indent}/* ${LEAD_GLYPHS} ${title} `;
    return `${head}${RULE_GLYPH.repeat(Math.max(2, DIVIDER_COLUMN - head.length - 3))} */`;
  }
  const head = `${indent}// ${LEAD_GLYPHS} ${title} `;
  return `${head}${RULE_GLYPH.repeat(Math.max(2, DIVIDER_COLUMN - head.length))}`;
}

/**
 * Every section divider in a file, canonical ones included, in source order.
 *
 * @remarks A rule-framed comment that carries prose is a doc block, not a divider, and never
 * appears here — the two are different things and only one of them has a fixed form.
 *
 * @since 0.6.0
 */
export function scanCommentDividers(content: string, language: DividerLanguage): Array<DividerRegion> {
  const lines = content.split(/\r?\n/);
  const regions: Array<DividerRegion> = [];

  for (let index = 0; index < lines.length; index++) {
    const region = readRegionAt(lines, index, language);
    if (region === null) {
      continue;
    }
    regions.push(region);
    index = region.endLine - 1;
  }

  return regions;
}

/**
 * Rewrites every off-convention divider into the canonical form.
 *
 * @since 0.6.0
 */
export function applyCommentDividerFixes(
  content: string,
  language: DividerLanguage,
): { readonly content: string; readonly fixedCount: number } {
  const regions = scanCommentDividers(content, language).filter((region) => region.defect !== null);
  if (regions.length === 0) {
    return { content, fixedCount: 0 };
  }

  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  // Descending, so an earlier region's replacement cannot shift a later region's line numbers.
  for (const region of [...regions].toReversed()) {
    lines.splice(
      region.startLine - 1,
      region.endLine - region.startLine + 1,
      renderDivider(region.indent, region.title, language),
    );
  }

  return { content: lines.join(newline), fixedCount: regions.length };
}

function readRegionAt(lines: Array<string>, index: number, language: DividerLanguage): DividerRegion | null {
  const line = lines[index]!;

  const titled = titledLinePattern.exec(line);
  const title = titled?.groups?.title?.trim();
  if (titled !== null && title !== undefined && title.length > 0 && !rulesOnlyPattern.test(title)) {
    const indent = titled.groups?.indent ?? "";
    const canonical = renderDivider(indent, title, language);
    return {
      startLine: index + 1,
      endLine: index + 1,
      indent,
      title,
      raw: line.trim(),
      defect: line === canonical ? null : usesCanonicalGlyphs(line) ? "bad-width" : "legacy-form",
    };
  }

  const ruleOnly = ruleOnlyLinePattern.exec(line);
  if (ruleOnly === null) {
    return null;
  }
  return readBannerAt(lines, index, ruleOnly.groups?.indent ?? "");
}

function readBannerAt(lines: Array<string>, index: number, indent: string): DividerRegion | null {
  const line = lines[index]!;
  // An unterminated `/*` opens a block whose body needs no per-line marker, so the run ends at `*/`.
  const insideBlock = line.trimStart().startsWith("/*") && !line.includes("*/");
  const body: Array<string> = [];
  let cursor = index + 1;
  while (cursor < lines.length && cursor - index <= MAX_BANNER_SPAN && !isBannerClose(lines[cursor]!, insideBlock)) {
    if (!insideBlock && !commentLinePattern.test(lines[cursor]!)) {
      break;
    }
    body.push(stripCommentPrefix(lines[cursor]!));
    cursor++;
  }

  const closed =
    cursor < lines.length && cursor - index <= MAX_BANNER_SPAN && isBannerClose(lines[cursor]!, insideBlock);
  const meaningful = body.filter((entry) => entry.length > 0);
  // A frame around prose is a doc block, and an unclosed rule is prose formatting inside one.
  if (!closed || meaningful.length !== 1 || !looksLikeTitle(meaningful[0]!)) {
    return null;
  }

  return {
    startLine: index + 1,
    endLine: cursor + 1,
    indent,
    title: meaningful[0]!,
    raw: line.trim(),
    defect: "legacy-form",
  };
}

function looksLikeTitle(text: string): boolean {
  return text.length <= MAX_TITLE_LENGTH && !text.endsWith(".");
}

function isBannerClose(line: string, insideBlock: boolean): boolean {
  if (ruleOnlyLinePattern.test(line)) {
    return true;
  }
  return insideBlock && bareRuleClosePattern.test(line);
}

function usesCanonicalGlyphs(line: string): boolean {
  return line.trimStart().startsWith(`// ${LEAD_GLYPHS} `) || line.trimStart().startsWith(`/* ${LEAD_GLYPHS} `);
}

function stripCommentPrefix(line: string): string {
  return line.replace(commentPrefixPattern, "").replace(commentSuffixPattern, "").trim();
}
