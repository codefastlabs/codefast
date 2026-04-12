import type { Bucket } from "#lib/arrange/types";

/** Analyze report: long literal threshold (token count). */
export const LONG_STRING_TOKEN_THRESHOLD = 18;

/**
 * Minimum token count for a string to be considered a candidate for grouping
 * in the apply/preview pipeline. Intentionally much lower than
 * {@link LONG_STRING_TOKEN_THRESHOLD} (analyze only).
 */
export const APPLY_MIN_TOKENS = 2;

/**
 * Minimum tokens a group must have to stand alone before singleton-merging.
 * Set to 2 so pairs like "transition outline-hidden" are not collapsed into an
 * unrelated bucket by the merger.
 */
export const MIN_GROUP_TOKENS = 2;

/** Dynamic max groups clamp: base bound. */
export const MAX_GROUPS_BASE = 4;

/** Dynamic max groups clamp: upper cap. */
export const MAX_GROUPS_CAP = 24;

/**
 * Extra slots so a few state / aria groups do not force `capGroups` to merge
 * adjacent surface + interaction (e.g. `bg-border` + `outline-hidden`).
 */
export const MAX_GROUPS_HEADROOM = 2;

/** Maximum findings printed per category in the analyze report. */
export const MAX_REPORT_LINES = 40;

/** Maximum recursion depth when traversing `tv()` object literals. */
export const MAX_OBJECT_DEPTH = 12;

/** Maximum depth when peeling conditional / parens / arrays inside `cn(...)` args. */
export const MAX_CLASS_EXPR_DEPTH = 12;

/**
 * Passed when optional `knownBindings` is missing — size 0 disables matching
 * for `cn` / `tv` identifier resolution.
 */
export const EMPTY_CN_TV_BINDINGS = new Set<string>();

/** Bucket sort order — pre-sort tokens before grouping (lower → earlier in output). */
export const BUCKET_ORDER: Record<Bucket, number> = {
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

/**
 * Compatible bucket pairs — a transition between these does NOT flush the
 * current group, so "flex size-4 shrink-0 items-center" stays together.
 */
export const COMPATIBLE_BUCKET_SETS: ReadonlyArray<ReadonlySet<Bucket>> = [
  new Set<Bucket>(["layout", "size"]),
  new Set<Bucket>(["motion", "interaction"]),
];

/**
 * Responsive / variant prefix — Tailwind v4 aware.
 *
 * v3: sm: md: … — v4: @sm:, @min-[600px]:, named container @sidebar/md:, …
 */
export const RESPONSIVE_PREFIX =
  /^(?:@(?:min|max)-\[[^\]]+\]:|@(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z][a-z0-9]*)?:|(?:max-|min-)?(?:sm|md|lg|xl|2xl|3xl):)/;

/** State variant stems — hoisted to module scope (not recreated per call). */
export const STATE_PREFIXES = new Set([
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
  "starting",
  "not",
  "has",
  "in",
  "nth",
  "file",
  "selection",
  "marker",
  "placeholder",
  "before",
  "after",
  "first-line",
  "first-letter",
  "backdrop",
  "details-content",
  "popover-open",
]);

/** Default directory for arrange analyze/preview/apply when no target is passed. */
export const DEFAULT_ARRANGE_TARGET = "packages/ui/src/components";
