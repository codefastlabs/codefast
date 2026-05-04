import type { Bucket } from "#/arrange/domain/types.domain";

/**
 * Analyze report: long literal threshold (token count).
 */
export const LONG_STRING_TOKEN_THRESHOLD = 18;

/**
 * Minimum token count for a string to be considered a candidate for grouping
 * in the apply/preview pipeline. Intentionally much lower than
 * {@link LONG_STRING_TOKEN_THRESHOLD} (analyze only).
 */
export const APPLY_MIN_TOKENS = 2;

/**
 * Minimum tokens a group must have to stand alone before singleton-merging.
 * Set to 2 so single-token groups are not collapsed into unrelated buckets by the merger.
 */
export const MIN_GROUP_TOKENS = 2;

/**
 * Dynamic max groups clamp: base bound.
 */
export const MAX_GROUPS_BASE = 4;

/**
 * Dynamic max groups clamp: upper cap.
 */
export const MAX_GROUPS_CAP = 24;

/**
 * Extra slots so a few state / aria groups do not force `capGroups` to merge
 * unrelated buckets (e.g. `bg-border` + `outline-hidden`).
 */
export const MAX_GROUPS_HEADROOM = 2;

/**
 * Maximum findings printed per category in the analyze report.
 */
export const MAX_REPORT_LINES = 40;

/**
 * Maximum recursion depth when traversing `tv()` object literals.
 */
export const MAX_OBJECT_DEPTH = 12;

/**
 * Maximum depth when peeling conditional / parens / arrays inside `cn(...)` args.
 */
export const MAX_CLASS_EXPR_DEPTH = 12;

/**
 * Maximum variant-stripping passes in {@link stripVariants}.
 * Real-world Tailwind stacks rarely exceed 4–5 segments (e.g. `@md/sidebar:group-hover:dark:focus-visible:`);
 * 12 is a conservative safety cap that prevents runaway loops on malformed input.
 */
export const MAX_STRIP_VARIANT_PASSES = 12;

/**
 * Passed when optional `knownBindings` is missing — size 0 disables matching
 * for `cn` / `tv` identifier resolution.
 */
export const EMPTY_CN_TV_BINDINGS = new Set<string>();

/**
 * Bucket sort order — **render pipeline** (lower → earlier in `cn()` output).
 *
 * Matches README: Existence → Position → Layout → Sizing → Spacing → Shape → Background
 * → Shadow → Typography → Composite → Motion → Starting → Behavior → State → Selector,
 * then `other` and `arbitrary` as sort tails for unknown utilities and arbitrary properties.
 */
export const BUCKET_ORDER: Record<Bucket, number> = {
  existence: 0,
  position: 1,
  layout: 2,
  sizing: 3,
  spacing: 4,
  shape: 5,
  background: 6,
  shadow: 7,
  typography: 8,
  composite: 9,
  motion: 10,
  starting: 11,
  behavior: 12,
  state: 13,
  selector: 14,
  other: 15,
  arbitrary: 16,
};

/**
 * Compatible bucket **pairs** — two adjacent tokens whose buckets appear in the same
 * `Set` may stay in one `cn()` string chunk. Compatibility is **not transitive**: there is
 * no `{position, sizing}` pair, so `fixed inset-0` and `overflow-auto` become **separate**
 * literals unless **layout** tokens sit between them in sorted order; then
 * `position↔layout` and `layout↔sizing` each justify one hop and the whole “box in flow”
 * (place + tracks + scrollport) stays in one chunk — co-located because they jointly define
 * stacking and scroll behavior for the same surface.
 */
export const COMPATIBLE_BUCKET_SETS: ReadonlyArray<ReadonlySet<Bucket>> = [
  // existence + position: named container / group / peer context edited next to inset & z-index.
  new Set<Bucket>(["existence", "position"]),
  // existence + layout: `group/cmd` + `flex …` are one template row (context + grid/flex).
  new Set<Bucket>(["existence", "layout"]),
  // position + layout: `fixed inset-0` + `grid` describe the same stacking + track shell.
  new Set<Bucket>(["position", "layout"]),
  // layout + sizing: `grid` + `overflow-auto` / min size are one scrollport / track concern.
  new Set<Bucket>(["layout", "sizing"]),
  // shape + shadow: radius/border + shadow/outline overlay are one “chrome” literal in UIs.
  new Set<Bucket>(["shape", "shadow"]),
  // background + shadow: fill + depth (card surface) without splitting noise across args.
  new Set<Bucket>(["background", "shadow"]),
  // background + typography: destructive buttons etc. (`bg-*` + `text-*` on the same control).
  new Set<Bucket>(["background", "typography"]),
  // layout + typography: title rows (`flex` + `text-sm`) in one literal when adjacent in sort order.
  new Set<Bucket>(["layout", "typography"]),
  // sizing + typography: chart shell (`aspect-video` + `text-xs`) before selector-variant chunks.
  new Set<Bucket>(["sizing", "typography"]),
  // motion + behavior: `transition-*` with `pointer-events-*` / `select-*` on the same surface.
  new Set<Bucket>(["motion", "behavior"]),
  // motion + starting: `transition` beside `starting:*` for coordinated enter/exit motion.
  new Set<Bucket>(["motion", "starting"]),
  // composite + motion: transforms then transitions (`-translate-*` + `transition-*` + `ease-*`).
  new Set<Bucket>(["composite", "motion"]),
  // sizing + composite: width/position utilities with transforms in one interaction block.
  new Set<Bucket>(["sizing", "composite"]),
  // sizing + spacing: width utilities with padding on the same slot (`w-auto` + `px-3`).
  new Set<Bucket>(["sizing", "spacing"]),
];

/**
 * Responsive / variant prefix — Tailwind v4 aware.
 *
 * v3: sm: md: … — v4: @sm:, @min-[600px]:, @[480px]:, named @md/sidebar:,
 * viewport md/sidebar:, min-[100px]: / max-[100px]:, …
 */
export const RESPONSIVE_PREFIX =
  /^(?:@(?:min|max)-\[[^\]]+\]:|@\[[^\]]+\]:|@(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z][a-z0-9-]*)?:|(?:max-|min-)?(?:sm|md|lg|xl|2xl|3xl)(?:\/[a-z][a-z0-9-]*)?:|(?:max-|min-)\[[^\]]+\]:)/;

/**
 * State variant stems — hoisted to module scope (not recreated per call).
 */
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
