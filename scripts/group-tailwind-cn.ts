#!/usr/bin/env tsx
/**
 * Phân tích và gợi ý phân nhóm chuỗi Tailwind trong `cn(...)` / `tv(...)`.
 *
 * Phát hiện literal trong đối số cn: chuỗi trực tiếp, ternary, mảng, nối chuỗi +.
 * tv: compoundVariants[].className / class; literal trong cn lồng dùng cùng quy tắc.
 * `cn(...)` trực tiếp trong cấu hình tv không khuyến nghị — analyze/preview/apply có thể
 * thay bằng chuỗi (1 đối số) hoặc mảng (≥2 đối số). Literal trong mảng tv trực tiếp
 * không tách bằng apply (tránh `[ [`).
 *
 * Hỗ trợ Tailwind CSS v4 đầy đủ:
 *   - Container queries (@min-* / @max-* / @sm / @md / @3xl / @max-3xs …)
 *   - Logical properties (ps/pe/ms/me/start/end)
 *   - not-* modifier; has-*; in-[…]; * / **; nth-* (kể cả số); media (pointer-*, contrast-* …)
 *   - Utilities mới: inset-shadow, field-sizing, mask-*, wrap-*, text-shadow-*, scheme-*, …
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

// Minimum token count for a string to be considered a candidate for grouping
// in the apply/preview pipeline. This is intentionally much lower than
// LONG_STRING_TOKEN_THRESHOLD (which is only used for the analyze report).
//
// The real gate for apply/preview is whether suggestCnGroups() produces more
// than one group — i.e. the string actually benefits from being split. This
// floor just avoids wasting work on trivially short strings (e.g. "flex p-2")
// that can never produce multiple meaningful groups.
const APPLY_MIN_TOKENS = 2;

// Minimum tokens a group must have to stand alone before singleton-merging.
// Set to 2 so that natural pairs like "transition outline-hidden" are never
// collapsed into an unrelated bucket (e.g. typography) by the merger.
const MIN_GROUP_TOKENS = 2;

// Dynamic MAX_GROUPS is clamped to [BASE, CAP]. Generous cap avoids capGroups
// merging unrelated concerns when pass 1 already produced many variant groups.
const MAX_GROUPS_BASE = 4;
const MAX_GROUPS_CAP = 24;

// Maximum number of findings printed per category in the analyze report.
const MAX_REPORT_LINES = 40;

// Maximum recursion depth when traversing tv() object literals.
const MAX_OBJECT_DEPTH = 12;

// Maximum depth when peeling conditional / parens / arrays inside cn(...) arguments.
const MAX_CLASS_EXPR_DEPTH = 12;

/** Passed when optional `knownBindings` is missing — size 0 disables matching. */
const EMPTY_CN_TV_BINDINGS = new Set<string>();

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
  // Do not pair surface + interaction in pass 1 — that merges unrelated tokens
  // (e.g. rounded-sm with cursor-default). Outline/outline-hidden still joins
  // motion via mergeSingletons + motion↔interaction compatibility.
];

function bucketsCompatible(a: Bucket, b: Bucket): boolean {
  if (a === b) return true;
  return COMPATIBLE_BUCKET_SETS.some((s) => s.has(a) && s.has(b));
}

/** Like bucketsCompatible, but never merge two distinct state variant blobs. */
function bucketsMergeCompatible(a: Bucket, b: Bucket): boolean {
  if (a === "state" && b === "state") return false;
  return bucketsCompatible(a, b);
}

// ---------------------------------------------------------------------------
// Responsive / variant prefix — Tailwind v4 aware
//
// v3:  sm: md: lg: xl: 2xl: max-sm: max-md: …
// v4:  @sm: @md: @lg: @xl: @2xl: (container query)
//       @min-[600px]: @max-[900px]: (arbitrary container query)
//       named container: @sidebar/md: etc.
// ---------------------------------------------------------------------------
// Named @container sizes include leading digits (@3xl, @2xs, @max-3xs, …) — the first
// segment after `@` must not be restricted to [a-z] only.
const RESPONSIVE_PREFIX =
  /^(?:@(?:min|max)-\[[^\]]+\]:|@(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z][a-z0-9]*)?:|(?:max-|min-)?(?:sm|md|lg|xl|2xl|3xl):)/;

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

/**
 * Variant stems not covered by a single entry in STATE_PREFIXES (compound `has-*`,
 * numbered `nth-*`, media features, v4 `in-[…]`, child selectors `*` / `**`, …).
 * When these are missed, `isStateToken` is false and the variant is stripped — the
 * utility is then bucketed as if it were unconditional, which breaks preview grouping.
 */
function isCompoundOrMediaVariantPrefix(prefix: string): boolean {
  if (prefix === "*" || prefix === "**") return true;
  if (prefix === "inert") return true;
  if (prefix.startsWith("has-")) return true;
  if (prefix.startsWith("in-[")) return true;
  // nth-3, nth-last-5, nth-of-type-4, nth-last-of-type-6, nth-[2n+1_of_li], …
  if (
    /^nth(?:-last)?(?:-of-type)?(?:-\d+|-\[)/.test(prefix) ||
    /^nth-of-type-\d+$/.test(prefix) ||
    /^nth-last-of-type-\d+$/.test(prefix)
  ) {
    return true;
  }
  if (
    /^(?:user-valid|user-invalid|contrast-more|contrast-less|forced-colors|inverted-colors)$/.test(
      prefix,
    )
  ) {
    return true;
  }
  if (/^(?:any-)?pointer-(?:fine|coarse|none)$/.test(prefix)) return true;
  if (/^(?:portrait|landscape|noscript)$/.test(prefix)) return true;
  return false;
}

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

/** Outermost variant segment: first `:` at bracket depth 0 → text before it. */
function firstLeadingVariantPrefix(token: string): string | undefined {
  let depth = 0;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "[") depth++;
    else if (token[i] === "]") depth--;
    else if (token[i] === ":" && depth === 0) {
      return token.slice(0, i);
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// isStateToken — all variant prefixes that should go in "state" bucket
// ---------------------------------------------------------------------------

function isStateToken(token: string): boolean {
  const prefix = firstLeadingVariantPrefix(token);
  if (prefix === undefined) return false;

  // Responsive / container query prefixes (check full token — regex is ^-anchored)
  if (RESPONSIVE_PREFIX.test(token)) return true;
  if (STATE_PREFIXES.has(prefix)) return true;

  // Arbitrary attribute selectors on data / aria / supports
  if (prefix.startsWith("data-[")) return true;
  if (prefix.startsWith("aria-[")) return true;
  if (prefix.startsWith("supports-[")) return true;

  // Shorthand data-* / aria-* variants (e.g. data-open:, aria-disabled:)
  if (/^data-(?!\[)/.test(prefix)) return true;
  if (/^aria-/.test(prefix)) return true;

  // Compound group/peer variants (group-hover:, peer-focus:, group-data-…:)
  if (/^(group|peer)-/.test(prefix)) return true;
  // not-disabled:, not-focus:, …
  if (/^not-/.test(prefix)) return true;

  if (isCompoundOrMediaVariantPrefix(prefix)) return true;

  return false;
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
    /^text-wrap-/.test(t) ||
    /^text-shadow(?:-|$)/.test(t) ||
    /^scheme-/.test(t)
  ) {
    return "typography";
  }

  // ── Motion / Animation ──────────────────────────────────────────────────
  if (
    /^(?:transition|duration|ease|delay|animate|will-change)(?:-|$)/.test(t) ||
    /^ease-/.test(t)
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

/** Dominant bucket of a whitespace-delimited class group (for merge heuristics). */
function dominantBucketOfGroup(g: string): Bucket {
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

/** Extract attribute name inside data-[...] for subgrouping (hyphenated names ok). */
function dataAttributeStem(token: string): string {
  const m = token.match(/^data-\[([^\]=]+)/);
  return m ? `data-[${m[1]}` : "data";
}

/** Same for aria-[pressed=true]:… */
function ariaAttributeStem(token: string): string {
  const m = token.match(/^aria-\[([^\]=]+)/);
  return m ? `aria-[${m[1]}` : "aria";
}

function stateKey(token: string): string {
  let depth = 0;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "[") depth++;
    else if (token[i] === "]") depth--;
    else if (token[i] === ":" && depth === 0) {
      const prefix = token.slice(0, i);
      // Sub-group data-[...] / aria-[...] variants by attribute stem.
      if (prefix.startsWith("data-[")) {
        return dataAttributeStem(token);
      }
      if (prefix.startsWith("aria-[")) {
        return ariaAttributeStem(token);
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
  return Math.max(MAX_GROUPS_BASE, Math.min(MAX_GROUPS_CAP, Math.ceil(tokenCount / 2)));
}

/**
 * Merge singleton groups (< MIN_GROUP_TOKENS tokens) into their nearest
 * neighbour. Prefers merging toward a bucket-compatible neighbor (same or
 * compatible bucket set). If **neither** neighbor is compatible, keeps the
 * singleton (avoids e.g. merging lone `text-sm` into `cursor-default …`).
 */
function mergeSingletons(groups: string[]): string[] {
  if (groups.length <= 1) return groups;
  const result = [...groups];

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      if (tokenizeClassString(result[i]).length < MIN_GROUP_TOKENS) {
        if (result.length === 1) break;
        const myBucket = dominantBucketOfGroup(result[i]);

        const prevCompat =
          i > 0 && bucketsMergeCompatible(myBucket, dominantBucketOfGroup(result[i - 1]));
        const nextCompat =
          i < result.length - 1 &&
          bucketsMergeCompatible(myBucket, dominantBucketOfGroup(result[i + 1]));

        let mergeDir: "forward" | "backward";
        if (nextCompat && !prevCompat) {
          mergeDir = "forward";
        } else if (prevCompat && !nextCompat) {
          mergeDir = "backward";
        } else if (prevCompat && nextCompat) {
          mergeDir = i < result.length - 1 ? "forward" : "backward";
        } else {
          continue;
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
 * Prefers bucket-compatible pairs, then lowest merge penalty, then smaller size.
 */
/** Higher = worse to merge when shrinking groups (incompatible pairs only). */
function capMergePenalty(a: Bucket, b: Bucket): number {
  if (a === "state" && b === "state") return 1_000;
  // Never merge variant blobs with base buckets before crossing other thresholds.
  if (a === "state" || b === "state") return 350;

  const hi = 100;
  const set = new Set([a, b]);
  if (set.has("surface") && set.has("typography")) return hi;
  if (set.has("typography") && set.has("interaction")) return hi;
  if (set.has("typography") && set.has("motion")) return hi;
  if (set.has("spacing") && set.has("typography")) return hi - 5;
  if (set.has("spacing") && set.has("surface")) return hi - 10;
  if (set.has("layout") && set.has("spacing")) return hi - 8;
  if (set.has("arbitrary")) return 60;
  return 0;
}

function capGroups(groups: string[], maxGroups: number): string[] {
  const result = [...groups];
  const lengths = result.map((g) => tokenizeClassString(g).length);

  while (result.length > maxGroups) {
    type Cand = { i: number; size: number; compat: boolean; penalty: number };
    const cands: Cand[] = [];
    for (let i = 0; i < result.length - 1; i++) {
      const d0 = dominantBucketOfGroup(result[i]);
      const d1 = dominantBucketOfGroup(result[i + 1]);
      const compat = bucketsMergeCompatible(d0, d1);
      cands.push({
        i,
        size: lengths[i] + lengths[i + 1],
        compat,
        penalty: compat ? 0 : capMergePenalty(d0, d1),
      });
    }
    const preferred = cands.filter((c) => c.compat);
    const pool = preferred.length > 0 ? preferred : cands;
    let best = pool[0]!;
    for (const c of pool) {
      if (c.penalty < best.penalty || (c.penalty === best.penalty && c.size < best.size)) {
        best = c;
      }
    }
    const bestIdx = best.i;
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

  // ── Pre-sort: by bucket order, then by original index (stable within bucket) ─
  // Ensures all layout tokens are adjacent, all surface tokens adjacent, etc.
  // Tie-breaking on source index preserves relative order among tokens that
  // share the same bucket, reducing avoidable cascade churn vs. an unstable sort.
  // Cross-bucket order still changes; review `apply` when overlapping utilities
  // depend on source order.
  // State tokens cluster together and are then sub-grouped by variant key.
  const classified = tokens.map((tok, index) => ({ tok, bucket: classifyToken(tok), index }));
  classified.sort((a, b) => {
    const od = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
    return od !== 0 ? od : a.index - b.index;
  });

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

function escapeTsStringLiteralContent(g: string): string {
  return g.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

/**
 * Multiline fragment for use *inside* an existing `cn(...)` — replaces one
 * string argument with several, without producing `cn(cn(...))`.
 */
export function formatCnArguments(
  groups: string[],
  options?: {
    indent?: string;
    /** When true, the last string group is followed by more args (or className). */
    commaAfterLastGroup?: boolean;
    trailingClassName?: boolean;
  },
): string {
  const indent = options?.indent ?? "  ";
  const commaAfterLast = options?.commaAfterLastGroup ?? options?.trailingClassName ?? false;
  const lines: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const comma = i < groups.length - 1 || commaAfterLast ? "," : "";
    lines.push(`${indent}"${escapeTsStringLiteralContent(g)}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push(`${indent}className,`);
  }
  return lines.join("\n");
}

export function formatCnCall(groups: string[], options?: { trailingClassName?: boolean }): string {
  const lines: string[] = ["cn("];
  const commaOnEachStringLine = groups.length > 1 || Boolean(options?.trailingClassName);
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const comma = commaOnEachStringLine ? "," : "";
    lines.push(`  "${escapeTsStringLiteralContent(g)}"${comma}`);
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
    const comma = i < groups.length - 1 || groups.length > 1 ? "," : "";
    lines.push(`  "${escapeTsStringLiteralContent(g)}"${comma}`);
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

// ---------------------------------------------------------------------------
// Import-aware cn/tv identifier resolution
//
// `isCnOrTvIdentifier` used to match any local variable named "cn" or "tv",
// which could produce false positives (e.g. a local `const cn = …` that is
// not the class-name utility). The helpers below resolve the identifier back
// to its import binding and verify it comes from a known tailwind-variants
// package, the project's internal #utils/tv alias, or at minimum is imported
// (not locally declared) — which is a strong signal it is the right utility.
// ---------------------------------------------------------------------------

/** Known module specifiers that export `cn` / `tv`. */
const KNOWN_CN_TV_MODULES = new Set([
  "tailwind-variants",
  "@codefast/tailwind-variants",
  "clsx",
  "class-variance-authority",
  "#utils/tv",
  "#utils/cn",
  "~/lib/utils",
  "@/lib/utils",
]);

/**
 * True for typical shadcn-style re-exports: `./utils`, `@/lib/utils`, `…/utils/…`,
 * or a dedicated `cn.ts` / `cn.tsx` module. Intentionally excludes arbitrary paths
 * that merely contain the substring "utils" (e.g. `my-utils`).
 */
function moduleLooksLikeCnTvReexport(mod: string): boolean {
  const norm = mod.replace(/\\/g, "/");
  if (/(?:^|[./])utils(?:\/|$)/.test(norm)) return true;
  if (/\/utils\//.test(norm) || /\/utils$/.test(norm)) return true;
  if (/(?:^|\/)cn\.tsx?$/.test(norm)) return true;
  return false;
}

/**
 * Build a set of local binding names that are imported from a known cn/tv
 * module in `sf`. Unknown specifiers are matched only via
 * {@link moduleLooksLikeCnTvReexport} (narrower than a bare "utils" substring).
 */
function buildKnownCnTvBindings(sf: ts.SourceFile): Set<string> {
  const bindings = new Set<string>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const spec = st.moduleSpecifier;
    if (!ts.isStringLiteral(spec)) continue;
    const mod = spec.text;
    const isKnown = KNOWN_CN_TV_MODULES.has(mod);
    if (!isKnown && !moduleLooksLikeCnTvReexport(mod)) continue;

    const clause = st.importClause;
    // default import: `import cn from "…"`
    if (clause.name) bindings.add(clause.name.text);
    // named imports: `import { cn, tv } from "…"`
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        // respect aliases: `import { cn as classNames } from "…"` → "classNames"
        bindings.add(el.name.text);
      }
    }
  }
  return bindings;
}

/**
 * Returns true when `expr` is an identifier whose name matches `name` AND
 * that name is listed in `knownBindings` from a recognized import. If the file
 * has no such imports (empty or omitted set), returns false — avoids treating
 * unrelated locals named `cn` / `tv` as the utilities.
 */
function isCnOrTvIdentifier(
  expr: ts.Expression,
  name: "cn" | "tv",
  knownBindings: Set<string> = EMPTY_CN_TV_BINDINGS,
): boolean {
  if (!ts.isIdentifier(expr) || expr.text !== name) return false;
  if (knownBindings.size === 0) return false;
  return knownBindings.has(expr.text);
}

export type ForEachStringLiteralInClassExpressionOptions = {
  /**
   * When `false`, do not visit literals inside `cond ? "a" : "b"`. Used when
   * building the cn/tv **apply** pool so mutually exclusive branch classes are
   * never merged into one static string (while `analyze` still uses the default).
   */
  descendIntoConditional?: boolean;
};

/**
 * Collect string / no-substitution template literals used as Tailwind class blobs
 * inside a `cn(...)` argument: direct literals, ternary branches, parenthesized
 * expressions, string arrays, and `a + b` string concatenation.
 *
 * Does not descend into arbitrary calls (e.g. `foo()`) to avoid false positives.
 */
export function forEachStringLiteralInClassExpression(
  expr: ts.Expression,
  sink: (node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral) => void,
  depth = 0,
  options?: ForEachStringLiteralInClassExpressionOptions,
): void {
  if (depth > MAX_CLASS_EXPR_DEPTH) return;

  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    sink(expr);
    return;
  }

  if (ts.isParenthesizedExpression(expr)) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (ts.isNonNullExpression(expr)) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (ts.isConditionalExpression(expr)) {
    if (options?.descendIntoConditional === false) {
      return;
    }
    forEachStringLiteralInClassExpression(expr.whenTrue, sink, depth + 1, options);
    forEachStringLiteralInClassExpression(expr.whenFalse, sink, depth + 1, options);
    return;
  }

  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    forEachStringLiteralInClassExpression(expr.left, sink, depth + 1, options);
    forEachStringLiteralInClassExpression(expr.right, sink, depth + 1, options);
    return;
  }

  if (ts.isArrayLiteralExpression(expr)) {
    for (const el of expr.elements) {
      if (ts.isSpreadElement(el)) continue;
      forEachStringLiteralInClassExpression(el, sink, depth + 1, options);
    }
  }
}

/** Replacing literals that sit inside an array arg would produce `cn([[...]])` or break `className: [[...]]`. */
function isUnsafeLiteralForCnStyleApplySplit(
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
): boolean {
  return ts.isArrayLiteralExpression(node.parent);
}

/** Options for walking cn args when merging literals for apply-time grouping only. */
const CN_APPLY_LITERAL_WALK_OPTS: ForEachStringLiteralInClassExpressionOptions = {
  descendIntoConditional: false,
};

/**
 * Literals that may be merged into one pool for `suggestCnGroups` / apply — excludes
 * strings that only appear under a ternary, so branch-exclusive classes are not
 * flattened together.
 */
function collectUnconditionalTailwindLiteralsFromCnArguments(
  args: ts.NodeArray<ts.Expression>,
): Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> {
  const staticLits: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> = [];
  for (const arg of args) {
    if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
      if (!isUnsafeLiteralForCnStyleApplySplit(arg)) {
        staticLits.push(arg);
      }
    } else {
      forEachStringLiteralInClassExpression(
        arg,
        (lit) => {
          if (!isUnsafeLiteralForCnStyleApplySplit(lit)) {
            staticLits.push(lit);
          }
        },
        0,
        CN_APPLY_LITERAL_WALK_OPTS,
      );
    }
  }
  return staticLits;
}

/**
 * Test helper: parse `<callee>(<argsSnippet>);` and return the merged unconditional literal
 * text (same pool as apply grouping). Default `callee` is `cn` (matches real imports).
 */
export function mergeCnUnconditionalLiteralPoolForTest(
  argsSnippet: string,
  options?: { callee?: string },
): string {
  const callee = options?.callee ?? "cn";
  const sourceText = `${callee}(${argsSnippet});`;
  const sf = ts.createSourceFile(
    "mergeCnUnconditionalLiteralPoolForTest.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const stmt = sf.statements[0];
  if (!ts.isExpressionStatement(stmt)) {
    throw new Error("expected expression statement");
  }
  const call = stmt.expression;
  if (
    !ts.isCallExpression(call) ||
    !ts.isIdentifier(call.expression) ||
    call.expression.text !== callee
  ) {
    throw new Error(`expected ${callee}(...) call`);
  }
  return collectUnconditionalTailwindLiteralsFromCnArguments(call.arguments)
    .map((n) => n.text)
    .join(" ");
}

function propertyAssignmentNameText(prop: ts.PropertyAssignment): string | undefined {
  if (ts.isIdentifier(prop.name)) return prop.name.text;
  if (ts.isStringLiteral(prop.name)) return prop.name.text;
  return undefined;
}

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

/**
 * Returns only the leading whitespace (tabs / spaces) of the line containing
 * `pos`. Unlike `indentBeforePosition`, non-whitespace characters before `pos`
 * on the same line are excluded. Used to compute the base indentation level
 * for JSX attribute replacements.
 */
function indentOfLineContaining(source: string, pos: number): string {
  let lineStart = pos;
  while (lineStart > 0) {
    const c = source[lineStart - 1];
    if (c === "\n" || c === "\r") break;
    lineStart--;
  }
  const nl = source.indexOf("\n", pos);
  const line = source.slice(lineStart, nl === -1 ? undefined : nl);
  const m = /^[\t ]*/.exec(line);
  return m?.[0] ?? "";
}

/**
 * Replace `cn(...)` nested in `tv({...})` with a plain string (one arg) or a string
 * array (multiple args), preserving each argument's source text (including dynamic
 * expressions). Returns undefined when there are zero arguments (invalid call).
 */
export function unwrapCnInsideTvCallReplacement(
  call: ts.CallExpression,
  sourceText: string,
  sf: ts.SourceFile,
): string | undefined {
  const args = call.arguments;
  if (args.length === 0) return undefined;
  const baseIndent = indentOfLineContaining(sourceText, call.getStart(sf));
  const innerIndent = `${baseIndent}  `;
  if (args.length === 1) {
    const a0 = args[0]!;
    return sourceText.slice(a0.getStart(sf), a0.getEnd());
  }
  const lines: string[] = ["["];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const piece = sourceText.slice(a.getStart(sf), a.getEnd());
    const comma = i < args.length - 1 || args.length > 1 ? "," : "";
    lines.push(`${innerIndent}${piece}${comma}`);
  }
  lines.push(`${baseIndent}]`);
  return lines.join("\n");
}

function applyEditsDescending(
  sourceText: string,
  edits: ReadonlyArray<{ start: number; end: number; replacement: string }>,
): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let t = sourceText;
  for (const e of sorted) {
    t = t.slice(0, e.start) + e.replacement + t.slice(e.end);
  }
  return t;
}

// ---------------------------------------------------------------------------
// JSX: static className string (analyze / apply)
// ---------------------------------------------------------------------------

type JsxClassNameStatic = {
  lit: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
  /** Replace this node: `StringLiteral` or whole `JsxExpression`. */
  valueNode: ts.Node;
};

function jsxClassNameStaticLiteral(attr: ts.JsxAttribute): JsxClassNameStatic | undefined {
  if (!ts.isIdentifier(attr.name) || attr.name.text !== "className") return undefined;
  const init = attr.initializer;
  if (!init) return undefined;

  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return { lit: init, valueNode: init };
  }
  if (ts.isJsxExpression(init) && init.expression) {
    const ex = init.expression;
    if (ts.isStringLiteral(ex) || ts.isNoSubstitutionTemplateLiteral(ex)) {
      return { lit: ex, valueNode: init };
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Shared tv() object traversal
// ---------------------------------------------------------------------------

type StringNodeVisitor = (
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
  sf: ts.SourceFile,
  /** When set, the literal is an argument of this `cn(...)` (e.g. nested inside `tv`). */
  cnCall?: ts.CallExpression,
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
  knownBindings?: Set<string>,
): void {
  if (depth > MAX_OBJECT_DEPTH) return;
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      visitor(init as ts.StringLiteral, sf, undefined);
    } else if (ts.isArrayLiteralExpression(init)) {
      for (const el of init.elements) {
        if (ts.isSpreadElement(el)) continue;
        if (ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el)) {
          visitor(el as ts.StringLiteral, sf, undefined);
        } else if (
          ts.isCallExpression(el) &&
          isCnOrTvIdentifier(el.expression, "cn", knownBindings)
        ) {
          for (const arg of el.arguments) {
            forEachStringLiteralInClassExpression(arg, (lit) => {
              visitor(lit, sf, el);
            });
          }
        } else if (ts.isObjectLiteralExpression(el)) {
          for (const inner of el.properties) {
            if (!ts.isPropertyAssignment(inner)) continue;
            const propName = propertyAssignmentNameText(inner);
            if (propName !== "className" && propName !== "class") continue;
            const innerInit = inner.initializer;
            if (ts.isStringLiteral(innerInit) || ts.isNoSubstitutionTemplateLiteral(innerInit)) {
              visitor(innerInit as ts.StringLiteral, sf, undefined);
            } else if (ts.isArrayLiteralExpression(innerInit)) {
              for (const innerEl of innerInit.elements) {
                if (ts.isSpreadElement(innerEl)) continue;
                if (ts.isStringLiteral(innerEl) || ts.isNoSubstitutionTemplateLiteral(innerEl)) {
                  visitor(innerEl as ts.StringLiteral, sf, undefined);
                }
              }
            } else if (
              ts.isCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              for (const arg of innerInit.arguments) {
                forEachStringLiteralInClassExpression(arg, (lit) => {
                  visitor(lit, sf, innerInit);
                });
              }
            }
          }
        }
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      traverseTvObject(sf, init, visitor, depth + 1, knownBindings);
    } else if (
      ts.isCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      for (const arg of init.arguments) {
        forEachStringLiteralInClassExpression(arg, (lit) => {
          visitor(lit, sf, init);
        });
      }
    }
  }
}

/**
 * Every `cn(...)` call whose initializer sits inside `tv({ ... })` (base, variants,
 * compoundVariants.class/className, or array slot). Used for analyze + unwrap apply.
 */
function collectCnCallsInsideTv(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  knownBindings: Set<string>,
  depth = 0,
): ts.CallExpression[] {
  if (depth > MAX_OBJECT_DEPTH) return [];
  const calls: ts.CallExpression[] = [];
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isArrayLiteralExpression(init)) {
      for (const el of init.elements) {
        if (ts.isSpreadElement(el)) continue;
        if (ts.isCallExpression(el) && isCnOrTvIdentifier(el.expression, "cn", knownBindings)) {
          calls.push(el);
        } else if (ts.isObjectLiteralExpression(el)) {
          for (const inner of el.properties) {
            if (!ts.isPropertyAssignment(inner)) continue;
            const propName = propertyAssignmentNameText(inner);
            if (propName !== "className" && propName !== "class") continue;
            const innerInit = inner.initializer;
            if (
              ts.isCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              calls.push(innerInit);
            }
          }
        }
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      calls.push(...collectCnCallsInsideTv(sf, init, knownBindings, depth + 1));
    } else if (
      ts.isCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      calls.push(init);
    }
  }
  return calls;
}

function listAllCnCallsInsideTvInSourceFile(
  sf: ts.SourceFile,
  knownBindings: Set<string>,
): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isCnOrTvIdentifier(node.expression, "tv", knownBindings)) {
      const arg0 = node.arguments[0];
      if (arg0 && ts.isObjectLiteralExpression(arg0)) {
        calls.push(...collectCnCallsInsideTv(sf, arg0, knownBindings, 0));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return calls;
}

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

type AnalyzeReport = {
  files: number;
  cnCallExpressions: number;
  tvCallExpressions: number;
  cnInsideTvCalls: Array<{
    file: string;
    line: number;
    argCount: number;
    preview: string;
  }>;
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
  longJsxClassNameLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
};

function analyzeCnCall(sf: ts.SourceFile, call: ts.CallExpression, report: AnalyzeReport): void {
  for (const arg of call.arguments) {
    forEachStringLiteralInClassExpression(arg, (lit) => {
      const text = lit.text;
      const n = tokenizeClassString(text).length;
      if (n >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longCnStringLiterals.push({
          file: sf.fileName,
          line: lineOf(sf, lit),
          tokenCount: n,
          preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
        });
      }
    });
  }
}

function analyzeDirectory(target: string): AnalyzeReport {
  const report: AnalyzeReport = {
    files: 0,
    cnCallExpressions: 0,
    tvCallExpressions: 0,
    cnInsideTvCalls: [],
    longCnStringLiterals: [],
    longTvStringLiterals: [],
    longJsxClassNameLiterals: [],
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

    const knownBindings = buildKnownCnTvBindings(sf);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        if (isCnOrTvIdentifier(node.expression, "cn", knownBindings)) {
          report.cnCallExpressions++;
          analyzeCnCall(sf, node, report);
        } else if (isCnOrTvIdentifier(node.expression, "tv", knownBindings)) {
          report.tvCallExpressions++;
          const arg0 = node.arguments[0];
          if (arg0 && ts.isObjectLiteralExpression(arg0)) {
            for (const nestedCn of collectCnCallsInsideTv(sf, arg0, knownBindings, 0)) {
              const src = sourceText.slice(nestedCn.getStart(sf), nestedCn.getEnd());
              const preview = src.length > 72 ? `${src.slice(0, 72)}…` : src;
              report.cnInsideTvCalls.push({
                file: sf.fileName,
                line: lineOf(sf, nestedCn),
                argCount: nestedCn.arguments.length,
                preview,
              });
            }
            traverseTvObject(
              sf,
              arg0,
              (strNode) => {
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
              },
              0,
              knownBindings,
            );
          }
        }
      }
      if (filePath.endsWith(".tsx") && ts.isJsxAttribute(node)) {
        const parsed = jsxClassNameStaticLiteral(node);
        if (parsed) {
          const text = parsed.lit.text;
          const n = tokenizeClassString(text).length;
          if (n >= LONG_STRING_TOKEN_THRESHOLD) {
            report.longJsxClassNameLiterals.push({
              file: sf.fileName,
              line: lineOf(sf, parsed.lit),
              tokenCount: n,
              preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
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
  out(
    `\nJSX className="..." hoặc className={'...'} (chuỗi tĩnh, ≥${LONG_STRING_TOKEN_THRESHOLD} token): ${r.longJsxClassNameLiterals.length}`,
  );
  for (const x of r.longJsxClassNameLiterals.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longJsxClassNameLiterals.length > MAX_REPORT_LINES) {
    out(`  … và ${r.longJsxClassNameLiterals.length - MAX_REPORT_LINES} vị trí khác`);
  }
  out(
    `\nGọi cn(...) lồng trong tv({...}) (nên thay bằng chuỗi hoặc mảng — preview/apply): ${r.cnInsideTvCalls.length}`,
  );
  for (const x of r.cnInsideTvCalls.slice(0, MAX_REPORT_LINES)) {
    out(`  ${x.file}:${x.line}  (${x.argCount} đối số)  ${x.preview}`);
  }
  if (r.cnInsideTvCalls.length > MAX_REPORT_LINES) {
    out(`  … và ${r.cnInsideTvCalls.length - MAX_REPORT_LINES} vị trí khác`);
  }
}

// ---------------------------------------------------------------------------
// AST: collect all long cn/tv string nodes in a source file
// ---------------------------------------------------------------------------

/**
 * A StringNode represents a single "grouping slot" — the full set of static
 * string literals that belong to one logical class surface:
 *
 *   cn("a b", "c d", expr)  → one slot: nodes=["a b","c d"], cnCall=<node>
 *   tv({ base: ["a","b"] }) → one slot per array: nodes=["a","b"], isTvContext=true
 *   tv({ base: "a b c" })   → one slot: nodes=["a b c"], isTvContext=true
 *
 * Grouping is performed over the *merged* token pool of all nodes in the slot,
 * so `suggestCnGroups` sees the full picture rather than individual fragments.
 */
type StringNode = {
  /** All static string literals belonging to this slot, in source order. */
  nodes: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral>;
  sf: ts.SourceFile;
  /** String slots in `tv({ ... })` that are not `cn(...)` arguments — use `formatArray`. */
  isTvContext: boolean;
  /** When set, the entire cn(...) call is replaced at once. */
  cnCall?: ts.CallExpression;
  // Convenience accessor kept for callers that need a single representative node
  // (e.g. for line-number reporting). Always the first node in the slot.
  get node(): ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
};

function makeStringNode(
  nodes: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral>,
  sf: ts.SourceFile,
  isTvContext: boolean,
  cnCall?: ts.CallExpression,
): StringNode {
  return {
    nodes,
    sf,
    isTvContext,
    cnCall,
    get node() {
      return this.nodes[0]!;
    },
  };
}

/** Merged class string for the whole slot — used as input to suggestCnGroups. */
function slotClassString(item: StringNode): string {
  return item.nodes.map((n) => n.text).join(" ");
}

function collectLongStringNodes(sf: ts.SourceFile): StringNode[] {
  const results: StringNode[] = [];
  // Deduplicate: track node positions already emitted to avoid visiting the
  // same AST node twice (happens with conditional rendering branches in
  // carousel.tsx, sidebar.tsx, field.tsx etc.).
  const seenNodePos = new Set<number>();
  const knownBindings = buildKnownCnTvBindings(sf);

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      if (isCnOrTvIdentifier(node.expression, "cn", knownBindings)) {
        // ── cn(...) slot: collect ALL simple static string args into one slot ──
        const callPos = node.getStart(sf);
        if (seenNodePos.has(callPos)) {
          ts.forEachChild(node, visit);
          return;
        }
        seenNodePos.add(callPos);

        // Pool = unconditional literals only; ternary branch strings stay dynamic
        // so we never merge e.g. items-end + items-center into one static group.
        const staticLits = collectUnconditionalTailwindLiteralsFromCnArguments(node.arguments);

        const totalTokens = staticLits.reduce((s, n) => s + tokenizeClassString(n.text).length, 0);
        if (staticLits.length > 0 && totalTokens >= APPLY_MIN_TOKENS) {
          results.push(makeStringNode(staticLits, sf, false, node));
        }
      } else if (isCnOrTvIdentifier(node.expression, "tv", knownBindings)) {
        const arg0 = node.arguments[0];
        if (arg0 && ts.isObjectLiteralExpression(arg0)) {
          // ── tv({}) slots: group by property value (each value = one slot) ──
          collectTvSlots(sf, arg0, knownBindings, results, seenNodePos);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return results;
}

/**
 * Walk a tv() object and emit one StringNode slot per logical class surface:
 *   - A string property value  →  slot with one node
 *   - An array property value  →  slot with all string elements merged
 *   - A cn(...) call value     →  slot with all string args merged (cnCall set)
 *
 * Recursive for nested objects (variants → { sm: { ... } }).
 */
function collectTvSlots(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  knownBindings: Set<string>,
  results: StringNode[],
  seenNodePos: Set<number>,
  depth = 0,
): void {
  if (depth > MAX_OBJECT_DEPTH) return;

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      // Single string value — one slot.
      emitTvSlot([init as ts.StringLiteral], sf, undefined, results, seenNodePos);
    } else if (ts.isArrayLiteralExpression(init)) {
      // Array value — all string elements form one merged slot.
      const arrayPos = init.getStart(sf);
      if (seenNodePos.has(arrayPos)) continue;
      seenNodePos.add(arrayPos);

      const staticLits: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> = [];
      for (const el of init.elements) {
        if (ts.isSpreadElement(el)) continue;
        if (ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el)) {
          staticLits.push(el as ts.StringLiteral);
        } else if (
          ts.isCallExpression(el) &&
          isCnOrTvIdentifier(el.expression, "cn", knownBindings)
        ) {
          // cn(...) inside an array slot — collect its string args into the
          // same pool; the cn call itself will be handled by the unwrap pass.
          for (const arg of el.arguments) {
            forEachStringLiteralInClassExpression(
              arg,
              (lit) => {
                if (!isUnsafeLiteralForCnStyleApplySplit(lit)) staticLits.push(lit);
              },
              0,
              CN_APPLY_LITERAL_WALK_OPTS,
            );
          }
        } else if (ts.isObjectLiteralExpression(el)) {
          // compoundVariants element — descend for className/class props.
          for (const inner of el.properties) {
            if (!ts.isPropertyAssignment(inner)) continue;
            const propName = propertyAssignmentNameText(inner);
            if (propName !== "className" && propName !== "class") continue;
            const innerInit = inner.initializer;
            if (ts.isStringLiteral(innerInit) || ts.isNoSubstitutionTemplateLiteral(innerInit)) {
              emitTvSlot([innerInit as ts.StringLiteral], sf, undefined, results, seenNodePos);
            } else if (ts.isArrayLiteralExpression(innerInit)) {
              const innerLits: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> = [];
              for (const innerEl of innerInit.elements) {
                if (
                  !ts.isSpreadElement(innerEl) &&
                  (ts.isStringLiteral(innerEl) || ts.isNoSubstitutionTemplateLiteral(innerEl))
                ) {
                  innerLits.push(innerEl as ts.StringLiteral);
                }
              }
              emitTvSlot(innerLits, sf, undefined, results, seenNodePos);
            } else if (
              ts.isCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              const cnLits: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> = [];
              for (const arg of innerInit.arguments) {
                forEachStringLiteralInClassExpression(
                  arg,
                  (lit) => {
                    if (!isUnsafeLiteralForCnStyleApplySplit(lit)) cnLits.push(lit);
                  },
                  0,
                  CN_APPLY_LITERAL_WALK_OPTS,
                );
              }
              emitTvSlot(cnLits, sf, innerInit, results, seenNodePos);
            }
          }
        }
      }
      // Emit the merged array slot (strings only — cn() calls inside are handled
      // by the unwrap pass separately).
      if (staticLits.length > 0) {
        emitTvSlot(staticLits, sf, undefined, results, seenNodePos);
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      collectTvSlots(sf, init, knownBindings, results, seenNodePos, depth + 1);
    } else if (
      ts.isCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      const cnLits: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> = [];
      for (const arg of init.arguments) {
        forEachStringLiteralInClassExpression(
          arg,
          (lit) => {
            if (!isUnsafeLiteralForCnStyleApplySplit(lit)) cnLits.push(lit);
          },
          0,
          CN_APPLY_LITERAL_WALK_OPTS,
        );
      }
      emitTvSlot(cnLits, sf, init, results, seenNodePos);
    }
  }
}

function emitTvSlot(
  lits: Array<ts.StringLiteral | ts.NoSubstitutionTemplateLiteral>,
  sf: ts.SourceFile,
  cnCall: ts.CallExpression | undefined,
  results: StringNode[],
  seenNodePos: Set<number>,
): void {
  if (lits.length === 0) return;
  // Deduplicate by first node position.
  const firstPos = lits[0]!.getStart(sf);
  if (seenNodePos.has(firstPos)) return;
  seenNodePos.add(firstPos);

  const totalTokens = lits.reduce((s, n) => s + tokenizeClassString(n.text).length, 0);
  if (totalTokens < APPLY_MIN_TOKENS) return;
  results.push(makeStringNode(lits, sf, true, cnCall));
}

/**
 * Build a full `cn(\n  "g1",\n  "g2",\n  ...remainingArgs\n)` replacement for
 * an entire `cn(...)` call expression.
 *
 * Key behaviour: ALL simple static string args are merged into a single token
 * pool before calling suggestCnGroups(), so the grouper sees the full class
 * surface rather than each arg in isolation. Dynamic args (identifiers,
 * ternaries, etc.) are preserved verbatim and appended after the groups.
 *
 * Example:
 *   cn("flex rounded-lg", "text-sm", "hover:bg-accent", className)
 *   → pool = "flex rounded-lg text-sm hover:bg-accent"
 *   → suggestCnGroups(pool) = ["flex rounded-lg", "text-sm", "hover:bg-accent"]
 *   → cn(\n  "flex rounded-lg",\n  "text-sm",\n  "hover:bg-accent",\n  className\n)
 */
function formatCnCallReplacement(
  item: StringNode,
  sourceText: string,
  withClassName: boolean,
): string {
  const call = item.cnCall!;
  const sf = item.sf;
  const baseIndent = indentOfLineContaining(sourceText, call.getStart(sf));
  const argIndent = `${baseIndent}  `;

  // Separate args into static string literals and everything else (dynamic).
  const dynamicArgTexts: string[] = [];
  for (const arg of call.arguments) {
    const isSimpleStatic =
      (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) &&
      !isUnsafeLiteralForCnStyleApplySplit(arg);
    if (!isSimpleStatic) {
      dynamicArgTexts.push(sourceText.slice(arg.getStart(sf), arg.getEnd()));
    }
  }

  // Group the merged pool of all static tokens.
  const pool = slotClassString(item);
  const groups = pool.trim() ? suggestCnGroups(pool) : [];

  const allArgs: string[] = [];

  if (groups.length > 1) {
    for (const group of groups) {
      allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(group)}"`);
    }
  } else if (groups.length === 1) {
    // Pool didn't split — emit a single merged string (still cleaner than the
    // original fragmented args).
    allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(groups[0]!)}"`);
  }

  for (const dyn of dynamicArgTexts) {
    allArgs.push(`${argIndent}${dyn}`);
  }

  if (withClassName) {
    allArgs.push(`${argIndent}className`);
  }

  // Multiline calls: trailing comma after every argument (matches oxfmt / Prettier).
  const argLines = allArgs.map((a, i) => (i < allArgs.length - 1 ? `${a},` : `${a}`));
  if (allArgs.length > 1) {
    const li = allArgs.length - 1;
    argLines[li] = `${allArgs[li]},`;
  }
  return `cn(\n${argLines.join("\n")}\n${baseIndent})`;
}

// ---------------------------------------------------------------------------
// JSX className → cn(...) value (format + import)
// ---------------------------------------------------------------------------

/** `className={cn(...)}` value for JSX; replaces the attribute value node only. */
export function formatJsxCnAttributeValue(
  groups: string[],
  source: string,
  valueNodeStart: number,
): string {
  const baseIndent = indentOfLineContaining(source, valueNodeStart);
  const argIndent = `${baseIndent}  `;
  const inner = formatCnArguments(groups, {
    indent: argIndent,
    commaAfterLastGroup: groups.length > 1,
  });
  return `{cn(\n${inner}\n${baseIndent})}`;
}

function sourceFileImportsCn(sf: ts.SourceFile): boolean {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const clause = st.importClause;
    if (clause.name?.text === "cn") return true;
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        if (el.name.text === "cn") return true;
      }
    }
  }
  return false;
}

function cnModuleSpecifierForFile(filePath: string, override?: string): string {
  if (override) return override;
  const norm = path.normalize(filePath).replace(/\\/g, "/");
  if (norm.includes("/packages/ui/")) return "#utils/tv";
  return "@codefast/tailwind-variants";
}

function findImportDeclarationFromModule(
  sf: ts.SourceFile,
  moduleSpecifier: string,
): ts.ImportDeclaration | undefined {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue;
    const spec = st.moduleSpecifier;
    if (ts.isStringLiteral(spec) && spec.text === moduleSpecifier) {
      return st;
    }
  }
  return undefined;
}

/**
 * Ensure `cn` is in scope: merge into an existing named import from the default
 * module for this file, or insert `import { cn } from "...";`.
 *
 * `alreadyHasCn` can be supplied when the caller has already evaluated
 * `sourceFileImportsCn` on the pre-edit source file, avoiding a second full
 * TypeScript parse of the (now slightly modified) `sourceText`.
 */
function ensureCnImport(
  sourceText: string,
  filePath: string,
  cnImportOverride?: string,
  alreadyHasCn?: boolean,
): string {
  // Re-parse only when we don't already know the answer.
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  if (alreadyHasCn ?? sourceFileImportsCn(sf)) return sourceText;

  const moduleSpecifier = cnModuleSpecifierForFile(filePath, cnImportOverride);
  const decl = findImportDeclarationFromModule(sf, moduleSpecifier);

  if (
    decl?.importClause &&
    !decl.importClause.isTypeOnly &&
    decl.importClause.namedBindings &&
    ts.isNamedImports(decl.importClause.namedBindings)
  ) {
    const elements = decl.importClause.namedBindings.elements;
    if (elements.length > 0) {
      const pos = elements[0].getStart(sf);
      return `${sourceText.slice(0, pos)}cn, ${sourceText.slice(pos)}`;
    }
  }

  const importLine = `import { cn } from "${moduleSpecifier}";`;

  let firstImport = -1;
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      firstImport = st.getStart(sf);
      break;
    }
  }

  const useClient = /^["']use client["'];?\s*\r?\n/.exec(sourceText);
  let insertAt: number;
  if (useClient) {
    insertAt = useClient[0].length;
  } else if (firstImport !== -1) {
    insertAt = firstImport;
  } else {
    insertAt = 0;
  }

  return `${sourceText.slice(0, insertAt)}${importLine}\n${sourceText.slice(insertAt)}`;
}

type GroupTarget =
  | { kind: "cnArg"; item: StringNode }
  | {
      kind: "jsxClassName";
      sf: ts.SourceFile;
      lit: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
      valueNode: ts.Node;
    };

function targetReplaceStart(t: GroupTarget): number {
  if (t.kind === "cnArg") {
    // We replace the whole cn() call when cnCall is present; use its start for
    // reverse-order sorting so later edits don't shift earlier positions.
    return t.item.cnCall ? t.item.cnCall.getStart(t.item.sf) : t.item.node.getStart(t.item.sf);
  }
  return t.valueNode.getStart(t.sf);
}

function collectLongJsxClassNameTargets(sf: ts.SourceFile): GroupTarget[] {
  const results: GroupTarget[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node)) {
      const parsed = jsxClassNameStaticLiteral(node);
      if (parsed && tokenizeClassString(parsed.lit.text).length >= APPLY_MIN_TOKENS) {
        results.push({
          kind: "jsxClassName",
          sf,
          lit: parsed.lit,
          valueNode: parsed.valueNode,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return results;
}

function collectGroupTargets(sf: ts.SourceFile, filePath: string): GroupTarget[] {
  const cnPart = collectLongStringNodes(sf).map((item) => ({ kind: "cnArg" as const, item }));
  if (!filePath.endsWith(".tsx")) return cnPart;
  return [...cnPart, ...collectLongJsxClassNameTargets(sf)];
}

type PlannedGroupEdit = {
  start: number;
  end: number;
  replacement: string;
  jsxCn: boolean;
  lineSf: ts.SourceFile;
  reportNode: ts.Node;
  label: string;
};

/**
 * Compute replacement range for a grouping target, or `undefined` when
 * `suggestCnGroups` yields a single group (no split).
 */
function planGroupEditForTarget(
  t: GroupTarget,
  textAfterUnwrap: string,
  withClassName: boolean,
): PlannedGroupEdit | undefined {
  if (t.kind === "jsxClassName") {
    const groups = suggestCnGroups(t.lit.text);
    if (groups.length <= 1) return undefined;
    const start = t.valueNode.getStart(t.sf);
    const end = t.valueNode.getEnd();
    const replacement = formatJsxCnAttributeValue(groups, textAfterUnwrap, start);
    return {
      start,
      end,
      replacement,
      jsxCn: true,
      lineSf: t.sf,
      reportNode: t.lit,
      label: "JSX className",
    };
  }

  const pool = slotClassString(t.item);
  const groups = suggestCnGroups(pool);
  if (groups.length <= 1) return undefined;

  if (!t.item.cnCall) {
    const firstNode = t.item.node;
    const parentArray =
      t.item.nodes.length > 1 && ts.isArrayLiteralExpression(firstNode.parent)
        ? firstNode.parent
        : null;
    const start = parentArray ? parentArray.getStart(t.item.sf) : firstNode.getStart(t.item.sf);
    const end = parentArray ? parentArray.getEnd() : firstNode.getEnd();
    const baseIndent = indentOfLineContaining(textAfterUnwrap, start);
    const replacement = formatArray(groups)
      .split("\n")
      .map((l, i) => (i === 0 ? l : `${baseIndent}${l}`))
      .join("\n");
    return {
      start,
      end,
      replacement,
      jsxCn: false,
      lineSf: t.item.sf,
      reportNode: firstNode,
      label: t.item.isTvContext ? "tv" : "cn",
    };
  }

  const call = t.item.cnCall;
  const start = call.getStart(t.item.sf);
  const end = call.getEnd();
  const replacement = formatCnCallReplacement(t.item, textAfterUnwrap, withClassName);
  return {
    start,
    end,
    replacement,
    jsxCn: false,
    lineSf: t.item.sf,
    reportNode: t.item.node,
    label: t.item.isTvContext ? "tv" : "cn",
  };
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
  options: { write: boolean; withClassName: boolean; cnImport?: string },
): GroupFileResult {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const knownBindings = buildKnownCnTvBindings(sf);
  const cnInTvCalls = listAllCnCallsInsideTvInSourceFile(sf, knownBindings);

  type UnwrapPlan = { start: number; end: number; replacement: string; call: ts.CallExpression };
  const unwrapPlans = cnInTvCalls
    .map((call): UnwrapPlan | undefined => {
      const replacement = unwrapCnInsideTvCallReplacement(call, sourceText, sf);
      if (replacement === undefined) return undefined;
      return { start: call.getStart(sf), end: call.getEnd(), replacement, call };
    })
    .filter((e): e is UnwrapPlan => e !== undefined);

  const unwrapEdits = unwrapPlans.filter((e) => sourceText.slice(e.start, e.end) !== e.replacement);

  const textAfterUnwrap =
    unwrapEdits.length > 0 ? applyEditsDescending(sourceText, unwrapEdits) : sourceText;

  const sfGrouped = ts.createSourceFile(
    filePath,
    textAfterUnwrap,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const groupTargets = collectGroupTargets(sfGrouped, filePath);
  const cnInTvNoReplacement = cnInTvCalls.length - unwrapPlans.length;

  const sortedTargets = [...groupTargets].sort(
    (a, b) => targetReplaceStart(b) - targetReplaceStart(a),
  );
  const plannedGroupEdits: PlannedGroupEdit[] = [];
  for (const t of sortedTargets) {
    const plan = planGroupEditForTarget(t, textAfterUnwrap, options.withClassName);
    if (plan === undefined) continue;
    if (textAfterUnwrap.slice(plan.start, plan.end) === plan.replacement) continue;
    plannedGroupEdits.push(plan);
  }

  const totalFound = unwrapEdits.length + plannedGroupEdits.length;

  if (cnInTvCalls.length === 0 && groupTargets.length === 0) {
    return { filePath, totalFound: 0, changed: 0 };
  }

  if (!options.write) {
    let unwrapArgErrorLines = 0;
    for (const call of cnInTvCalls) {
      if (unwrapCnInsideTvCallReplacement(call, sourceText, sf) === undefined) {
        unwrapArgErrorLines++;
      }
    }

    if (totalFound === 0 && unwrapArgErrorLines === 0) {
      return { filePath, totalFound: 0, changed: 0 };
    }

    let header = `\n── ${filePath} (${totalFound + unwrapArgErrorLines} vị trí`;
    if (cnInTvNoReplacement > 0) {
      header += `; thêm ${cnInTvNoReplacement} cn() trong tv không đổi (0 đối số)`;
    }
    header += `) ──`;
    out(header);

    for (const call of cnInTvCalls) {
      const replacement = unwrapCnInsideTvCallReplacement(call, sourceText, sf);
      if (replacement === undefined) {
        out(`  Dòng ${lineOf(sf, call)} [tv ⊃ cn]: cn(...) không có đối số — bỏ qua`);
        continue;
      }
      const start = call.getStart(sf);
      const end = call.getEnd();
      if (sourceText.slice(start, end) === replacement) continue;
      out(`  Dòng ${lineOf(sf, call)} [tv ⊃ cn → chuỗi/mảng]:`);
      out(`  ${replacement.split("\n").join("\n  ")}`);
    }
    if (unwrapEdits.length > 0 && plannedGroupEdits.length > 0) {
      out(
        "  (Các dòng [cn] / [tv] / [JSX className] bên dưới theo nội dung sau bước unwrap cn trong tv.)",
      );
    }
    for (const plan of plannedGroupEdits) {
      out(`  Dòng ${lineOf(plan.lineSf, plan.reportNode)} [${plan.label}]:`);
      out(`  ${plan.replacement.split("\n").join("\n  ")}`);
    }
    return {
      filePath,
      totalFound: totalFound + unwrapArgErrorLines,
      changed: 0,
    };
  }

  // Pre-check whether `cn` is already in scope using the original parse (before
  // any edits), avoiding a second full parse inside ensureCnImport when unchanged.
  const originallyHasCnImport = sourceFileImportsCn(sf);

  const groupEdits = plannedGroupEdits.map((p) => ({
    start: p.start,
    end: p.end,
    replacement: p.replacement,
    jsxCn: p.jsxCn,
  }));

  const touchedJsxCn = groupEdits.some((e) => e.jsxCn);
  let newText =
    groupEdits.length > 0 ? applyEditsDescending(textAfterUnwrap, groupEdits) : textAfterUnwrap;

  const changed = unwrapEdits.length + groupEdits.length;

  if (changed > 0) {
    if (touchedJsxCn) {
      newText = ensureCnImport(newText, filePath, options.cnImport, originallyHasCnImport);
    }
    fs.writeFileSync(filePath, newText, "utf8");
  }

  return { filePath, totalFound: changed, changed };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const DEFAULT_TARGET = "packages/ui/src/components";

/** Mảng chuỗi (không dùng template literal) để IDE như WebStorm không inject JSX vào nội dung help. */
const HELP = [
  "Gợi ý tách chuỗi class Tailwind (v4): đối số trong cn(...)/tv(...), literal tĩnh JSX className, và bỏ cn lồng trong tv (→ chuỗi / mảng).",
  "",
  "Cách làm đề xuất: analyze → preview → apply (xem trước rồi mới ghi file).",
  "",
  "Lệnh:",
  "  analyze [dir|file]",
  "      Liệt kê: chuỗi dài, cn lồng trong tv (nên đổi sang chuỗi/mảng), v.v. Mặc định: packages/ui/src/components",
  "",
  "  preview [dir|file] [--with-classname]",
  "      Dry-run: in gợi ý thay thế từng vị trí, không ghi file. Chạy trước apply để xem trước.",
  "",
  "  apply [dir|file] [--with-classname]",
  "      Áp dụng: (1) cn(...) trong tv({...}) → một chuỗi nếu 1 đối số, mảng nếu ≥2; (2) tách nhóm class dài trong cn/tv/JSX; JSX thêm import cn nếu thiếu.",
  "      Mặc định: packages/ui/src/components",
  "",
  '  group "<classes>" [--tv]',
  "      Thử nhanh trên một chuỗi class (copy-paste kết quả). Mặc định in cn(...); --tv in [...] cho tv().",
  "",
  "Tùy chọn:",
  "  --with-classname   Dùng khi bạn muốn bổ sung đối số className vào cuối lời gọi cn(...) (xem preview trước).",
  "  --cn-import=<mod>  Ghi đè module specifier dùng khi thêm import cn (mặc định: tự suy theo đường dẫn file).",
  "                     Ví dụ: --cn-import=@/lib/utils",
  "",
  "pnpm (từ root repo):",
  "  pnpm tailwind:cn-analyze [dir|file]",
  "  pnpm tailwind:cn-preview [dir|file] [--with-classname]",
  "  pnpm tailwind:cn-apply [dir|file] [--with-classname]",
  "",
  "tsx trực tiếp:",
  "  pnpm exec tsx scripts/group-tailwind-cn.ts <lệnh> ...",
  "",
  "Ví dụ:",
  "  pnpm tailwind:cn-analyze",
  "  pnpm tailwind:cn-analyze packages/ui/src/components/calendar.tsx",
  "  pnpm tailwind:cn-preview packages/ui/src/components",
  "  pnpm tailwind:cn-apply packages/ui/src/components/button.tsx",
  '  pnpm exec tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border px-3 text-sm font-medium"',
  '  pnpm exec tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border" --tv',
].join("\n");

function parseArgs(argv: string[]): {
  cmd: string;
  target: string | undefined;
  withClassName: boolean;
  tv: boolean;
  inlineClasses: string | undefined;
  cnImport: string | undefined;
} {
  // Extract --cn-import=<value> or --cn-import <value> before flag-set construction.
  let cnImport: string | undefined;
  const filteredArgv: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--cn-import=")) {
      cnImport = a.slice("--cn-import=".length);
    } else if (a === "--cn-import") {
      cnImport = argv[i + 1];
      i++;
    } else {
      filteredArgv.push(a);
    }
  }

  const flags = new Set(filteredArgv.filter((a) => a.startsWith("--")));
  const positional = filteredArgv.filter((a) => !a.startsWith("--"));

  const cmd = positional[0] ?? "";
  const withClassName = flags.has("--with-classname");
  const tv = flags.has("--tv");

  // Second positional is either a path or an inline class string.
  //
  // Robust heuristic — avoids false positives from Tailwind v4 container
  // query syntax like "@min-[600px]/sidebar:flex" which contains "/".
  // A value is treated as a path only when it:
  //   • starts with a path separator or leading dot (./  ../  /  C:\  \)
  //   • OR ends with a known TS extension (.ts / .tsx)
  //   • OR exists verbatim on disk (fallback for bare relative paths like "src")
  // Plain class strings never satisfy any of these conditions.
  const second = positional.slice(1).join(" ");
  const looksLikePath =
    second.length > 0 &&
    (/^\.{0,2}[/\\]/.test(second) ||
      /^[A-Za-z]:[/\\]/.test(second) ||
      second.endsWith(".ts") ||
      second.endsWith(".tsx") ||
      fs.existsSync(second));

  return {
    cmd,
    target: looksLikePath ? path.resolve(second) : undefined,
    inlineClasses: looksLikePath ? undefined : second || undefined,
    withClassName,
    tv,
    cnImport,
  };
}

function runOnTarget(
  target: string,
  options: { write: boolean; withClassName: boolean; cnImport?: string },
): void {
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

  out(`\nTổng: ${filePaths.length} file, ${totalFound} vị trí (cn/tv/JSX className) cần xem xét.`);
  if (options.write) {
    out(`Đã áp dụng: ${totalChanged} vị trí được cập nhật.`);
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
    runOnTarget(target, {
      write: true,
      withClassName: args.withClassName,
      cnImport: args.cnImport,
    });
    return;
  }

  // ── preview [dir|file] — dry-run of apply ───────────────────────────────
  if (args.cmd === "preview") {
    const target = args.target ?? path.resolve(DEFAULT_TARGET);
    runOnTarget(target, {
      write: false,
      withClassName: args.withClassName,
      cnImport: args.cnImport,
    });
    return;
  }

  // ── group "<classes>" — quick inline test ───────────────────────────────
  if (args.cmd === "group") {
    if (!args.inlineClasses) {
      err('Cần truyền chuỗi class. Ví dụ: group "flex gap-2 text-sm rounded-md"');
      process.exit(1);
    }
    // process.exit() is typed as `never` but TypeScript doesn't narrow through
    // it in all compiler configurations. The non-null assertion is safe here
    // because the branch above unconditionally exits when inlineClasses is falsy.
    const groups = suggestCnGroups(args.inlineClasses!);
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
