#!/usr/bin/env tsx
/**
 * Phân tích và gợi ý phân nhóm chuỗi Tailwind trong `cn(...)` / `tv(...)`.
 *
 * Hỗ trợ Tailwind CSS v4 đầy đủ:
 *   - Container queries (@min-* / @max-* / @sm / @md …)
 *   - Logical properties (ps/pe/ms/me/start/end)
 *   - not-* modifier
 *   - Utilities mới: inset-shadow, field-sizing, mask-*, wrap-*, etc.
 *   - Arbitrary variants [&...] mọi dạng
 *
 * Usage:
 *   pnpm exec tsx scripts/group-tailwind-cn.ts analyze [dir]
 *   pnpm exec tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border px-3"
 *   pnpm exec tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border" --tv
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

function err(line: string): void {
  process.stderr.write(`${line}\n`);
}

const LONG_STRING_TOKEN_THRESHOLD = 18;

// Minimum tokens a group must have to stand alone before singleton-merging.
// Set to 2 so that natural pairs like "transition outline-hidden" are never
// collapsed into an unrelated bucket (e.g. typography) by the merger.
const MIN_GROUP_TOKENS = 2;

// Dynamic MAX_GROUPS is clamped to [BASE, CAP].
const MAX_GROUPS_BASE = 4;
const MAX_GROUPS_CAP = 8;

// Maximum number of findings printed per category in the analyze report.
const MAX_REPORT_LINES = 40;

// Maximum recursion depth when traversing tv() object literals.
const MAX_OBJECT_DEPTH = 12;

// ---------------------------------------------------------------------------
// Bucket types
// ---------------------------------------------------------------------------

type Bucket =
  | "layout"
  | "size"
  | "spacing"
  | "surface"
  | "typography"
  | "motion"
  | "state"
  | "interaction"
  | "arbitrary"
  | "other";

// ---------------------------------------------------------------------------
// Bucket sort order — used for pre-sorting tokens before grouping.
// Lower number → earlier group in the output.
// ---------------------------------------------------------------------------

const BUCKET_ORDER: Record<Bucket, number> = {
  layout: 0,
  size: 1,
  spacing: 2,
  surface: 3,
  typography: 4,
  motion: 5,
  interaction: 6,
  state: 7,
  other: 8,
  arbitrary: 9,
};

// ---------------------------------------------------------------------------
// Compatible bucket pairs — a transition between these does NOT flush the
// current group, so "flex size-4 shrink-0 items-center" stays together.
// ---------------------------------------------------------------------------

const COMPATIBLE_BUCKET_SETS: ReadonlyArray<ReadonlySet<Bucket>> = [
  new Set<Bucket>(["layout", "size"]),
  // transition + outline-hidden are frequently co-located as a "reset / base
  // behavior" group in component classes. Keeping them compatible avoids
  // singleton-merging one of them into an unrelated typography/surface group.
  new Set<Bucket>(["motion", "interaction"]),
  // outline-hidden often appears immediately after border/ring/shadow tokens
  // (the "visual shell" of a component). Allowing surface+interaction
  // compatibility lets a lone outline-hidden attach to a nearby surface group
  // instead of being pulled into typography by the positional fallback.
  new Set<Bucket>(["surface", "interaction"]),
];

function bucketsCompatible(a: Bucket, b: Bucket): boolean {
  if (a === b) return true;
  return COMPATIBLE_BUCKET_SETS.some((s) => s.has(a) && s.has(b));
}

// ---------------------------------------------------------------------------
// Responsive / variant prefix — Tailwind v4 aware
//
// v3:  sm: md: lg: xl: 2xl: max-sm: max-md: …
// v4:  @sm: @md: @lg: @xl: @2xl: (container query)
//       @min-[600px]: @max-[900px]: (arbitrary container query)
//       named container: @sidebar/md: etc.
// ---------------------------------------------------------------------------
const RESPONSIVE_PREFIX =
  /^(?:@(?:min|max)-\[[^\]]+\]:|@(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:\/[a-z][a-z0-9]*)?:|(?:max-|min-)?(?:sm|md|lg|xl|2xl|3xl):)/;

// ---------------------------------------------------------------------------
// State variant prefixes — hoisted to module scope (not recreated per call).
// ---------------------------------------------------------------------------

const STATE_PREFIXES = new Set([
  "hover",
  "focus",
  "focus-within",
  "focus-visible",
  "active",
  "visited",
  "link",
  "any-link",
  "disabled",
  "enabled",
  "checked",
  "indeterminate",
  "required",
  "optional",
  "valid",
  "invalid",
  "in-range",
  "out-of-range",
  "read-only",
  "read-write",
  "placeholder-shown",
  "default",
  "autofill",
  "open",
  "closed",
  "first",
  "last",
  "only",
  "odd",
  "even",
  "first-of-type",
  "last-of-type",
  "only-of-type",
  "first-child",
  "last-child",
  "only-child",
  "empty",
  "target",
  "group",
  "peer",
  "aria",
  "data",
  "dark",
  "light",
  "supports",
  "motion-reduce",
  "motion-safe",
  "print",
  "screen",
  "ltr",
  "rtl",
  "starting", // v4: @starting-style
  "not", // v4: not-* modifier
  "has", // v4: has-* modifier
  "in", // v4: in-* modifier (ancestor)
  "nth", // v4: nth-* modifier
  "file",
  "selection",
  "marker",
  "placeholder",
  "before",
  "after",
  "first-line",
  "first-letter",
  "backdrop",
  "details-content", // v4
  "popover-open", // v4
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenizeClassString(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

// Strip all variant prefixes to get the bare utility name.
// e.g. "hover:dark:md:text-sm" → "text-sm"
// e.g. "@min-[600px]:flex" → "flex"
function stripVariants(token: string): string {
  let t = token;
  const MAX_PASSES = 12;
  for (let i = 0; i < MAX_PASSES; i++) {
    let depth = 0;
    let colonIdx = -1;
    for (let ci = 0; ci < t.length; ci++) {
      if (t[ci] === "[") depth++;
      else if (t[ci] === "]") depth--;
      else if (t[ci] === ":" && depth === 0) {
        colonIdx = ci;
        break;
      }
    }
    if (colonIdx === -1) break;
    t = t.slice(colonIdx + 1);
  }
  return t;
}

// ---------------------------------------------------------------------------
// isStateToken — all variant prefixes that should go in "state" bucket
// ---------------------------------------------------------------------------

function isStateToken(token: string): boolean {
  // If the token has no colon outside brackets, it is NOT a state variant.
  let depth = 0;
  let hasColon = false;
  for (const ch of token) {
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    else if (ch === ":" && depth === 0) {
      hasColon = true;
      break;
    }
  }
  if (!hasColon) return false;

  // Responsive / container query prefixes
  if (RESPONSIVE_PREFIX.test(token)) return true;

  const prefix = token.split(":")[0];
  return STATE_PREFIXES.has(prefix);
}

// ---------------------------------------------------------------------------
// classifyToken — full Tailwind v4 coverage
// ---------------------------------------------------------------------------

function classifyToken(token: string): Bucket {
  // ── Arbitrary class / arbitrary variant ────────────────────────────────
  if (token.startsWith("[") || token.includes("[&") || token.includes("[.")) {
    return "arbitrary";
  }

  // ── State / variant prefix ─────────────────────────────────────────────
  if (isStateToken(token)) {
    return "state";
  }

  const t = stripVariants(token);

  // ── Layout ──────────────────────────────────────────────────────────────
  if (
    /^(?:flex|inline-flex|grid|inline-grid|block|inline|hidden|contents|flow-root|table(?:-|$)|list-item)/.test(
      t,
    ) ||
    /^(?:items|justify|content|self|place)-/.test(t) ||
    /^(?:gap|space-[xy]|col-|row-|grid-|auto-cols|auto-rows|order-|order$)/.test(t) ||
    /^(?:overflow|overscroll|object-|isolate$|isolation-|z-|float-|clear-|columns-|break-)/.test(
      t,
    ) ||
    /^(?:absolute|relative|fixed|sticky|static|container)$/.test(t) ||
    /^(?:wrap-|flex-wrap|flex-nowrap|flex-row|flex-col|flex-auto|flex-initial|flex-none|flex-1|flex-[0-9])/.test(
      t,
    ) ||
    /^(?:subgrid|masonry)$/.test(t) ||
    t === "flex" ||
    t === "grid" ||
    // Bare structural modifiers — define element relationships, not visual state.
    // "peer" / "group" without a variant suffix (e.g. "peer/name") belong here.
    /^(?:peer|group)(?:\/[a-z][a-z0-9-]*)?$/.test(t)
  ) {
    return "layout";
  }

  // ── Size ────────────────────────────────────────────────────────────────
  if (
    /^(?:w|h|min-w|max-w|min-h|max-h|size|aspect|shrink|grow|basis)-/.test(t) ||
    t === "shrink" ||
    t === "grow" ||
    /^field-sizing-/.test(t)
  ) {
    return "size";
  }

  // ── Spacing ─────────────────────────────────────────────────────────────
  // Includes logical properties (v4): ps pe ms me, and positional: start end
  if (
    /^-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|inset|top|right|bottom|left|start|end)-/.test(
      t,
    ) ||
    /^-?(?:inset|top|right|bottom|left|start|end)(?:\/|$)/.test(t) ||
    /^-?(?:inset-x|inset-y)-/.test(t)
  ) {
    return "spacing";
  }

  // ── Surface (visual decoration) ─────────────────────────────────────────
  if (
    /^(?:rounded|border|ring|divide|bg|from|via|to|fill|stroke|shadow|opacity)(?:-|\/|$)/.test(t) ||
    /^(?:backdrop-blur|backdrop-filter|backdrop-|blur|drop-shadow|mix-blend)-/.test(t) ||
    /^(?:inset-shadow|inset-ring|mask-)/.test(t) ||
    t === "border" ||
    t === "rounded" ||
    t === "shadow" ||
    t === "ring" ||
    t === "blur"
  ) {
    return "surface";
  }

  // ── Typography ──────────────────────────────────────────────────────────
  if (
    /^(?:text|font|leading|tracking|list|indent|align|whitespace|break|line-clamp|hyphens)-/.test(
      t,
    ) ||
    /^(?:antialiased|subpixel-antialiased|italic|not-italic|overline|line-through|underline|no-underline|uppercase|lowercase|capitalize|normal-case|truncate|text-wrap|text-balance|text-pretty)$/.test(
      t,
    ) ||
    /^text-wrap-/.test(t)
  ) {
    return "typography";
  }

  // ── Motion / Animation ──────────────────────────────────────────────────
  if (
    /^(?:transition|duration|ease|delay|animate|will-change)(?:-|$)/.test(t) ||
    /^animate-/.test(t)
  ) {
    return "motion";
  }

  // ── Interaction ─────────────────────────────────────────────────────────
  // Note: overscroll-* is intentionally classified as "layout" (see above).
  // outline-hidden / outline-none are explicitly interaction, not surface —
  // listed here so they don't fall through to the "other" bucket or get
  // singleton-merged into a typography/surface group.
  if (
    /^(?:outline|cursor|pointer-events|select|appearance|resize|touch-action|scroll-behavior|scroll-snap|caret|accent)(?:-|$)/.test(
      t,
    ) ||
    /^(?:outline|cursor|select|resize)$/.test(t) ||
    t === "outline-hidden" ||
    t === "outline-none"
  ) {
    return "interaction";
  }

  return "other";
}

// ---------------------------------------------------------------------------
// stateKey — uses the FIRST colon outside brackets (top-level variant prefix)
//
// This groups compound variants by their outermost context so that e.g.
// "hover:not-disabled:border-ring/60" and "hover:bg-accent" share the same
// key ("hover") and are not split apart, while "focus-visible:*" tokens
// correctly cluster separately from "hover:*" tokens.
//
// Special case for data-[...]: the key includes the attribute stem so that
// semantically unrelated data attributes (e.g. data-[range-*] vs data-[state=*]
// vs data-[vaul-drawer-direction=*]) form separate groups instead of all
// collapsing under the single key "data".
//
// Previous implementation used the LAST colon, which over-split state groups
// whenever compound variants like "focus-visible:aria-checked:*" appeared.
// ---------------------------------------------------------------------------

/** Extract the leading attribute stem from a data-[...] variant string.
 *  e.g. "data-[range-end=true]:rounded-md" → "data-[range"
 *       "data-[state=open]:animate-in"      → "data-[state"
 *       "data-[vaul-drawer-direction=bottom]:inset-x-0" → "data-[vaul"
 *  Falls back to "data" if the bracket content cannot be parsed.
 */
function dataAttributeStem(token: string): string {
  const m = token.match(/^data-\[([^\]=/-]+)/);
  return m ? `data-[${m[1]}` : "data";
}

function stateKey(token: string): string {
  let depth = 0;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "[") depth++;
    else if (token[i] === "]") depth--;
    else if (token[i] === ":" && depth === 0) {
      const prefix = token.slice(0, i);
      // Sub-group data-[...] variants by attribute stem to avoid collapsing
      // semantically distinct data attributes (range vs state vs vaul-*) into
      // one giant group.
      if (prefix.startsWith("data-[")) {
        return dataAttributeStem(token);
      }
      return prefix;
    }
  }
  return token;
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

/** Dynamic cap: more tokens → allow more groups, within [BASE, CAP]. */
function dynamicMaxGroups(tokenCount: number): number {
  return Math.max(MAX_GROUPS_BASE, Math.min(MAX_GROUPS_CAP, Math.ceil(tokenCount / 4)));
}

/**
 * Merge singleton groups (< MIN_GROUP_TOKENS tokens) into their nearest
 * neighbour. Prefers merging toward a bucket-compatible neighbor (same or
 * compatible bucket set) to avoid cross-bucket pollution (e.g. interaction
 * tokens landing in a typography group). Falls back to forward-then-backward
 * if no compatible neighbor exists.
 */
function mergeSingletons(groups: string[]): string[] {
  if (groups.length <= 1) return groups;
  const result = [...groups];

  /** Dominant bucket of a group (most-represented bucket among its tokens). */
  function dominantBucket(g: string): Bucket {
    const counts = new Map<Bucket, number>();
    for (const tok of tokenizeClassString(g)) {
      const b = classifyToken(tok);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    let best: Bucket = "other";
    let bestN = 0;
    for (const [b, n] of counts) {
      if (n > bestN) {
        best = b;
        bestN = n;
      }
    }
    return best;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      if (tokenizeClassString(result[i]).length < MIN_GROUP_TOKENS) {
        if (result.length === 1) break;
        const myBucket = dominantBucket(result[i]);

        // Determine merge direction: prefer a bucket-compatible neighbor.
        const prevCompat = i > 0 && bucketsCompatible(myBucket, dominantBucket(result[i - 1]));
        const nextCompat =
          i < result.length - 1 && bucketsCompatible(myBucket, dominantBucket(result[i + 1]));

        let mergeDir: "forward" | "backward";
        if (nextCompat && !prevCompat) {
          mergeDir = "forward";
        } else if (prevCompat && !nextCompat) {
          mergeDir = "backward";
        } else {
          // Both or neither compatible → use positional default.
          mergeDir = i < result.length - 1 ? "forward" : "backward";
        }

        if (mergeDir === "forward") {
          result[i + 1] = result[i] + " " + result[i + 1];
        } else {
          result[i - 1] = result[i - 1] + " " + result[i];
        }
        result.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return result;
}

/**
 * Merge adjacent groups until total count ≤ maxGroups.
 * Caches token counts alongside the result array to avoid O(n²) re-splitting.
 * Always merges the pair with fewest combined tokens (least information loss).
 */
function capGroups(groups: string[], maxGroups: number): string[] {
  const result = [...groups];
  const lengths = result.map((g) => tokenizeClassString(g).length);

  while (result.length > maxGroups) {
    let bestIdx = 0;
    let bestSize = Infinity;
    for (let i = 0; i < result.length - 1; i++) {
      const size = lengths[i] + lengths[i + 1];
      if (size < bestSize) {
        bestSize = size;
        bestIdx = i;
      }
    }
    result[bestIdx] = result[bestIdx] + " " + result[bestIdx + 1];
    lengths[bestIdx] = lengths[bestIdx] + lengths[bestIdx + 1];
    result.splice(bestIdx + 1, 1);
    lengths.splice(bestIdx + 1, 1);
  }
  return result;
}

export function suggestCnGroups(classString: string): string[] {
  const tokens = tokenizeClassString(classString);
  if (tokens.length === 0) return [];

  // ── Pre-sort: stable sort tokens by bucket order ──────────────────────────
  // Ensures all layout tokens are adjacent, all surface tokens adjacent, etc.,
  // regardless of the author's original ordering. This is safe in Tailwind v4
  // because cascade layers eliminate source-order specificity conflicts.
  // State tokens cluster together and are then sub-grouped by variant key.
  const classified = tokens.map((tok) => ({ tok, bucket: classifyToken(tok) }));
  classified.sort((a, b) => BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket]);

  // ── Pass 1: bucket-based split, with state sub-grouping by variant key ────
  const rawGroups: string[] = [];
  let currentBucket: Bucket | null = null;
  let currentStateKey: string | null = null;
  let currentTokens: string[] = [];

  const flush = (): void => {
    if (currentTokens.length > 0) {
      rawGroups.push(currentTokens.join(" "));
      currentTokens = [];
    }
  };

  for (const { tok, bucket: b } of classified) {
    if (currentBucket === null) {
      currentBucket = b;
      currentStateKey = b === "state" ? stateKey(tok) : null;
      currentTokens.push(tok);
      continue;
    }

    // Incompatible bucket transition → flush and start a new group.
    if (!bucketsCompatible(b, currentBucket)) {
      flush();
      currentBucket = b;
      currentStateKey = b === "state" ? stateKey(tok) : null;
      currentTokens.push(tok);
      continue;
    }

    // Same or compatible bucket. For state tokens, also split on key change.
    if (b === "state") {
      const key = stateKey(tok);
      if (key !== currentStateKey) {
        flush();
        currentBucket = b;
        currentStateKey = key;
      }
    } else if (currentBucket !== b) {
      // Compatible-but-different boundary (e.g. layout ↔ size): update bucket
      // without flushing so the group stays together.
      currentBucket = b;
    }

    currentTokens.push(tok);
  }
  flush();

  // ── Pass 2: merge singleton groups ────────────────────────────────────────
  const merged = mergeSingletons(rawGroups);

  // ── Pass 3: cap total groups (dynamic based on token count) ───────────────
  return capGroups(merged, dynamicMaxGroups(tokens.length));
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatCnCall(groups: string[], options?: { trailingClassName?: boolean }): string {
  const lines: string[] = ["cn("];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const comma = i < groups.length - 1 || options?.trailingClassName ? "," : "";
    lines.push(`  "${g.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push("  className,");
  }
  lines.push(")");
  return lines.join("\n");
}

export function formatArray(groups: string[]): string {
  const lines: string[] = ["["];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const comma = i < groups.length - 1 ? "," : "";
    lines.push(`  "${g.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"${comma}`);
  }
  lines.push("]");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

function walkTsxFiles(root: string): string[] {
  const result: string[] = [];
  const SKIP_DIRS = new Set([
    "node_modules",
    "dist",
    ".git",
    ".turbo",
    ".next",
    ".cache",
    "out",
    "build",
    "coverage",
    ".vercel",
    ".output",
  ]);
  const visit = (p: string) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(p)) {
        if (SKIP_DIRS.has(name)) continue;
        visit(path.join(p, name));
      }
      return;
    }
    if (p.endsWith(".tsx") || p.endsWith(".ts")) result.push(p);
  };
  visit(root);
  return result;
}

// ---------------------------------------------------------------------------
// TypeScript AST helpers
// ---------------------------------------------------------------------------

function isCnOrTvIdentifier(expr: ts.Expression, name: "cn" | "tv"): boolean {
  return ts.isIdentifier(expr) && expr.text === name;
}

function stringNodeText(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

// ---------------------------------------------------------------------------
// Shared tv() object traversal
// ---------------------------------------------------------------------------

type StringNodeVisitor = (
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
  sf: ts.SourceFile,
) => void;

/**
 * Recursively traverse a tv() object literal, calling `visitor` for every
 * string literal found at any depth. Shared by both the analyze and group
 * pipelines to eliminate the previously duplicated traversal logic.
 */
function traverseTvObject(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  visitor: StringNodeVisitor,
  depth = 0,
): void {
  if (depth > MAX_OBJECT_DEPTH) return;
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      visitor(init as ts.StringLiteral, sf);
    } else if (ts.isArrayLiteralExpression(init)) {
      for (const el of init.elements) {
        if (ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el)) {
          visitor(el as ts.StringLiteral, sf);
        }
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      traverseTvObject(sf, init, visitor, depth + 1);
    } else if (ts.isCallExpression(init) && isCnOrTvIdentifier(init.expression, "cn")) {
      for (const arg of init.arguments) {
        if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
          visitor(arg as ts.StringLiteral, sf);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

type AnalyzeReport = {
  files: number;
  cnCallExpressions: number;
  tvCallExpressions: number;
  longCnStringLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
  longTvStringLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
};

function analyzeCnCall(sf: ts.SourceFile, call: ts.CallExpression, report: AnalyzeReport): void {
  for (const arg of call.arguments) {
    const text = stringNodeText(arg);
    if (text === undefined) continue;
    const n = tokenizeClassString(text).length;
    if (n >= LONG_STRING_TOKEN_THRESHOLD) {
      report.longCnStringLiterals.push({
        file: sf.fileName,
        line: lineOf(sf, arg),
        tokenCount: n,
        preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
      });
    }
  }
}

function analyzeDirectory(target: string): AnalyzeReport {
  const report: AnalyzeReport = {
    files: 0,
    cnCallExpressions: 0,
    tvCallExpressions: 0,
    longCnStringLiterals: [],
    longTvStringLiterals: [],
  };

  const files = fs.statSync(target).isDirectory() ? walkTsxFiles(target) : [target];

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sf = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    report.files++;

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        if (isCnOrTvIdentifier(node.expression, "cn")) {
          report.cnCallExpressions++;
          analyzeCnCall(sf, node, report);
        } else if (isCnOrTvIdentifier(node.expression, "tv")) {
          report.tvCallExpressions++;
          const arg0 = node.arguments[0];
          if (arg0 && ts.isObjectLiteralExpression(arg0)) {
            traverseTvObject(sf, arg0, (strNode) => {
              const text = strNode.text;
              const n = tokenizeClassString(text).length;
              if (n >= LONG_STRING_TOKEN_THRESHOLD) {
                report.longTvStringLiterals.push({
                  file: sf.fileName,
                  line: lineOf(sf, strNode),
                  tokenCount: n,
                  preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
                });
              }
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return report;
}

function printAnalyzeReport(dir: string, r: AnalyzeReport): void {
  out(`Đường dẫn: ${path.resolve(dir)}`);
  out(`File .ts/.tsx: ${r.files}`);
  out(`Số lần gọi cn(...): ${r.cnCallExpressions}`);
  out(`Số lần gọi tv(...): ${r.tvCallExpressions}`);
  out(
    `\nChuỗi literal trong cn có ≥${LONG_STRING_TOKEN_THRESHOLD} token (cân nhắc tách đối số): ${r.longCnStringLiterals.length}`,
  );
  for (const x of r.longCnStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longCnStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … và ${r.longCnStringLiterals.length - MAX_REPORT_LINES} vị trí khác`);
  }
  out(
    `\nChuỗi literal trong cấu hình tv (base/variants/…) ≥${LONG_STRING_TOKEN_THRESHOLD} token: ${r.longTvStringLiterals.length}`,
  );
  for (const x of r.longTvStringLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longTvStringLiterals.length > MAX_REPORT_LINES) {
    out(`  … và ${r.longTvStringLiterals.length - MAX_REPORT_LINES} vị trí khác`);
  }
}

// ---------------------------------------------------------------------------
// AST: collect all long cn/tv string nodes in a source file
// ---------------------------------------------------------------------------

type StringNode = {
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
  sf: ts.SourceFile;
  isTvContext: boolean;
};

function collectLongStringNodes(sf: ts.SourceFile): StringNode[] {
  const results: StringNode[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      if (isCnOrTvIdentifier(node.expression, "cn")) {
        for (const arg of node.arguments) {
          if (
            (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) &&
            tokenizeClassString(arg.text).length >= LONG_STRING_TOKEN_THRESHOLD
          ) {
            results.push({ node: arg as ts.StringLiteral, sf, isTvContext: false });
          }
        }
      } else if (isCnOrTvIdentifier(node.expression, "tv")) {
        const arg0 = node.arguments[0];
        if (arg0 && ts.isObjectLiteralExpression(arg0)) {
          traverseTvObject(sf, arg0, (strNode) => {
            if (tokenizeClassString(strNode.text).length >= LONG_STRING_TOKEN_THRESHOLD) {
              results.push({ node: strNode, sf, isTvContext: true });
            }
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return results;
}

// ---------------------------------------------------------------------------
// Core: group a single source file in-place or dry-run
// ---------------------------------------------------------------------------

type GroupFileResult = {
  filePath: string;
  totalFound: number;
  changed: number;
};

function groupFile(
  filePath: string,
  options: { write: boolean; withClassName: boolean },
): GroupFileResult {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const nodes = collectLongStringNodes(sf);
  if (nodes.length === 0) return { filePath, totalFound: 0, changed: 0 };

  if (!options.write) {
    // Dry-run: print suggestions
    out(`\n── ${filePath} (${nodes.length} chuỗi) ──`);
    for (const { node, isTvContext } of nodes) {
      const groups = suggestCnGroups(node.text);
      const replacement = isTvContext
        ? formatArray(groups)
        : formatCnCall(groups, { trailingClassName: options.withClassName });
      out(`  Dòng ${lineOf(sf, node)}:`);
      out(`  ${replacement.split("\n").join("\n  ")}`);
    }
    return { filePath, totalFound: nodes.length, changed: 0 };
  }

  // Write mode: apply replacements back-to-front to preserve offsets
  const sorted = [...nodes].sort((a, b) => b.node.getStart(b.sf) - a.node.getStart(a.sf));

  let newText = sourceText;
  let changed = 0;
  for (const { node, isTvContext, sf: nodeSf } of sorted) {
    const groups = suggestCnGroups(node.text);
    if (groups.length <= 1) continue; // nothing to split

    const replacement = isTvContext
      ? formatArray(groups)
      : formatCnCall(groups, { trailingClassName: options.withClassName });

    const start = node.getStart(nodeSf);
    const end = node.getEnd();
    newText = newText.slice(0, start) + replacement + newText.slice(end);
    changed++;
  }

  if (changed > 0) {
    fs.writeFileSync(filePath, newText, "utf8");
  }

  return { filePath, totalFound: nodes.length, changed };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const DEFAULT_TARGET = "packages/ui/src/components";

const HELP = `
Phân nhóm Tailwind class trong cn(...) / tv(...) — hỗ trợ Tailwind CSS v4.

Usage:
  group-tailwind-cn analyze [dir|file]
      Quét và báo cáo các chuỗi class dài cần tách nhóm.
      Mặc định: packages/ui/src/components

  group-tailwind-cn apply [dir|file] [--with-classname]
      Ghi đè phân nhóm cho tất cả chuỗi dài trong dir/file (= pnpm tailwind:cn-apply).
      Mặc định: packages/ui/src/components
      --with-classname  Thêm "className," làm đối số cuối của cn().

  group-tailwind-cn preview [dir|file] [--with-classname]
      Xem trước kết quả phân nhóm mà không ghi file (dry-run của apply).

  group-tailwind-cn group "<classes>" [--tv]
      Phân nhóm nhanh một chuỗi class inline (để test / copy-paste).
      --tv              In ra dạng mảng [...] thay vì cn(...).

package.json scripts:
  pnpm tailwind:cn-analyze          → analyze packages/ui/src/components
  pnpm tailwind:cn-apply            → apply   packages/ui/src/components

Examples:
  pnpm tailwind:cn-analyze
  pnpm tailwind:cn-analyze src/components/Button.tsx

  pnpm tailwind:cn-apply
  pnpm tailwind:cn-apply src/components/Button.tsx --with-classname

  pnpm tsx scripts/group-tailwind-cn.ts preview src/components
  pnpm tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border px-3 text-sm font-medium"
  pnpm tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border" --tv
`.trim();

function parseArgs(argv: string[]): {
  cmd: string;
  target: string | undefined;
  withClassName: boolean;
  tv: boolean;
  inlineClasses: string | undefined;
} {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));

  const cmd = positional[0] ?? "";
  const withClassName = flags.has("--with-classname");
  const tv = flags.has("--tv");

  // Second positional is either a path or an inline class string.
  // Heuristic: contains "/" or "\" or ends with .ts/.tsx or exists on disk → path.
  const second = positional.slice(1).join(" ");
  const looksLikePath =
    second.length > 0 &&
    (second.includes("/") ||
      second.includes("\\") ||
      second.endsWith(".ts") ||
      second.endsWith(".tsx") ||
      fs.existsSync(second));

  return {
    cmd,
    target: looksLikePath ? path.resolve(second) : undefined,
    inlineClasses: looksLikePath ? undefined : second || undefined,
    withClassName,
    tv,
  };
}

function runOnTarget(target: string, options: { write: boolean; withClassName: boolean }): void {
  if (!fs.existsSync(target)) {
    err(`Không tìm thấy: ${target}`);
    process.exit(1);
  }

  const filePaths = fs.statSync(target).isDirectory() ? walkTsxFiles(target) : [target];

  let totalFound = 0;
  let totalChanged = 0;

  for (const fp of filePaths) {
    const result = groupFile(fp, options);
    totalFound += result.totalFound;
    totalChanged += result.changed;
  }

  out(`\nTổng: ${filePaths.length} file, ${totalFound} chuỗi cần xem xét.`);
  if (options.write) {
    out(`Đã áp dụng: ${totalChanged} chuỗi được cập nhật.`);
  } else {
    out(`(Chạy "apply" để ghi đè, hoặc "pnpm tailwind:cn-apply" cho toàn bộ project)`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    out(HELP);
    process.exit(0);
  }

  const args = parseArgs(argv);

  // ── analyze [dir|file] ──────────────────────────────────────────────────
  if (args.cmd === "analyze") {
    const target = args.target ?? path.resolve(DEFAULT_TARGET);
    if (!fs.existsSync(target)) {
      err(`Không tìm thấy: ${target}`);
      process.exit(1);
    }
    printAnalyzeReport(target, analyzeDirectory(target));
    return;
  }

  // ── apply [dir|file] — write mode (used by pnpm tailwind:cn-apply) ──────
  if (args.cmd === "apply") {
    const target = args.target ?? path.resolve(DEFAULT_TARGET);
    runOnTarget(target, { write: true, withClassName: args.withClassName });
    return;
  }

  // ── preview [dir|file] — dry-run of apply ───────────────────────────────
  if (args.cmd === "preview") {
    const target = args.target ?? path.resolve(DEFAULT_TARGET);
    runOnTarget(target, { write: false, withClassName: args.withClassName });
    return;
  }

  // ── group "<classes>" — quick inline test ───────────────────────────────
  if (args.cmd === "group") {
    if (!args.inlineClasses) {
      err('Cần truyền chuỗi class. Ví dụ: group "flex gap-2 text-sm rounded-md"');
      process.exit(1);
    }
    const groups = suggestCnGroups(args.inlineClasses);
    const result = args.tv
      ? formatArray(groups)
      : formatCnCall(groups, { trailingClassName: args.withClassName });
    out(result);
    const bucketSummary = groups.map((g) => {
      const uniq = new Set(tokenizeClassString(g).map(classifyToken));
      return uniq.size === 1 ? [...uniq][0] : `mixed:${[...uniq].sort().join("+")}`;
    });
    out(`\n// Buckets: ${JSON.stringify(bucketSummary)}`);
    return;
  }

  err(`Lệnh không hợp lệ: "${args.cmd}". Chạy --help để xem hướng dẫn.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Entry point guard — prevents main() from running when this module is
// imported by tests or other scripts (e.g. for suggestCnGroups unit tests).
// ---------------------------------------------------------------------------
const _scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === _scriptPath) {
  main();
}
