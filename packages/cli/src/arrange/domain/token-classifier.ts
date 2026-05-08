import {
  COMPATIBLE_BUCKET_SETS,
  RESPONSIVE_PREFIX,
  STATE_PREFIXES,
} from "#/arrange/domain/constants";
import { indexOfFirstVariantColon, stripVariants } from "#/arrange/domain/tailwind-token";
import type { Bucket } from "#/arrange/domain/types";

/**
 * Bare-token classification is **total** (always returns a {@link Bucket}). The `Result` pattern
 * (`isOk` / `isErr`) belongs at arrange use-case / I/O boundaries, not on this hot path.
 *
 * Variant stems not covered by a single entry in STATE_PREFIXES (compound `has-*`,
 * numbered `nth-*`, media features, v4 `in-[…]`, child selectors `*` / `**`, …).
 * When these are missed, `isStateToken` is false and the variant is stripped — the
 * utility is then bucketed as if it were unconditional, which breaks preview grouping.
 */
function isCompoundOrMediaVariantPrefix(prefix: string): boolean {
  if (prefix === "*" || prefix === "**") {
    return true;
  }
  if (prefix === "inert") {
    return true;
  }
  if (prefix.startsWith("has-")) {
    return true;
  }
  if (prefix.startsWith("in-[")) {
    return true;
  }
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
  if (/^(?:any-)?pointer-(?:fine|coarse|none)$/.test(prefix)) {
    return true;
  }
  if (/^(?:portrait|landscape|noscript)$/.test(prefix)) {
    return true;
  }
  return false;
}

/**
 * Outermost variant segment: first `:` at bracket depth 0 → text before it.
 */
function firstLeadingVariantPrefix(token: string): string | undefined {
  const colonIdx = indexOfFirstVariantColon(token);
  if (colonIdx === -1) {
    return undefined;
  }
  return token.slice(0, colonIdx);
}

function isSelectorVariantToken(token: string): boolean {
  const prefix = firstLeadingVariantPrefix(token);
  if (prefix === undefined) {
    return false;
  }

  if (prefix === "*" || prefix === "**") {
    return true;
  }
  if (prefix.startsWith("has-")) {
    return true;
  }
  if (prefix.startsWith("in-[")) {
    return true;
  }
  if (prefix.startsWith("group-[")) {
    return true;
  }
  if (prefix.startsWith("peer-[")) {
    return true;
  }
  if (prefix.startsWith("not-[")) {
    return true;
  }
  return false;
}

function isStateToken(token: string): boolean {
  const prefix = firstLeadingVariantPrefix(token);
  if (prefix === undefined) {
    return false;
  }

  if (RESPONSIVE_PREFIX.test(token)) {
    return true;
  }
  if (STATE_PREFIXES.has(prefix)) {
    return true;
  }

  if (prefix.startsWith("data-[")) {
    return true;
  }
  if (prefix.startsWith("aria-[")) {
    return true;
  }
  if (prefix.startsWith("supports-[")) {
    return true;
  }

  // Tailwind v4: style when inside an ancestor with matching `data-*` (e.g. `in-data-side-left:`,
  // `in-data-[slot=tooltip-content]:`). The short stem `in` is in STATE_PREFIXES but outer
  // prefixes are `in-data-…`, so they must be recognized explicitly.
  if (prefix.startsWith("in-data-")) {
    return true;
  }

  if (/^data-(?!\[)/.test(prefix)) {
    return true;
  }
  if (/^aria-/.test(prefix)) {
    return true;
  }

  if (/^(group|peer)-/.test(prefix)) {
    return true;
  }
  if (/^not-/.test(prefix)) {
    return true;
  }

  if (isCompoundOrMediaVariantPrefix(prefix)) {
    return true;
  }

  if (prefix.startsWith("[") && prefix.endsWith("]")) {
    return true;
  }

  return false;
}

/**
 * Secondary sort inside the **composite** bucket: opacity / blend / isolation →
 * 3D context → 3D transforms → 2D transforms → filters → will-change.
 *
 * @since 0.3.16-canary.0
 */
export function compositeSecondaryOrder(bareUtility: string): number {
  const b = bareUtility;
  if (
    /^opacity(?:-|$)/.test(b) ||
    /^mix-blend-/.test(b) ||
    /^isolation(?:-|$)/.test(b) ||
    b === "isolate"
  ) {
    return 0;
  }
  if (b === "transform-3d" || /^perspective(?:-|$)/.test(b)) {
    return 10;
  }
  if (
    /^rotate-[xyz](?:-|$)/.test(b) ||
    /^translate-z(?:-|$)/.test(b) ||
    /^scale-z(?:-|$)/.test(b)
  ) {
    return 20;
  }
  if (
    /^translate(?:-|$)/.test(b) ||
    /^scale(?:-|$)/.test(b) ||
    /^rotate(?:-|$)/.test(b) ||
    /^skew(?:-|$)/.test(b)
  ) {
    return 30;
  }
  if (/^transform(?:-(?:gpu|cpu|none))?$/.test(b)) {
    return 35;
  }
  if (
    /^blur(?:-|$)/.test(b) ||
    /^backdrop-/.test(b) ||
    /^filter(?:-|$)/.test(b) ||
    /^brightness-/.test(b) ||
    /^contrast-/.test(b) ||
    /^grayscale(?:-|$)/.test(b) ||
    /^hue-rotate-/.test(b) ||
    /^invert(?:-|$)/.test(b) ||
    /^saturate-/.test(b) ||
    /^sepia(?:-|$)/.test(b)
  ) {
    return 40;
  }
  if (/^will-change/.test(b)) {
    return 50;
  }
  return 99;
}

/**
 * Classify a **bare** utility (no `hover:` / `md:` / … prefixes).
 */
function classifyBareUtility(bareUtility: string): Bucket {
  const b = bareUtility;

  // --- Existence: display roots, containment, named groups/peers ---
  if (/^@container(?:\/[a-z][a-z0-9-]*)?$/i.test(b)) {
    return "existence";
  }
  if (
    /^(?:hidden|contents|sr-only|not-sr-only|list-item|flow-root)$/.test(b) ||
    /^(?:block|inline-block|inline)$/.test(b)
  ) {
    return "existence";
  }
  if (/^table(?:$|-)/.test(b)) {
    return "existence";
  }
  if (/^contain-/.test(b)) {
    return "existence";
  }
  if (/^(?:group|peer)(?:\/[a-z][a-z0-9-]*)?$/.test(b)) {
    return "existence";
  }

  // --- Position ---
  if (/^(?:static|relative|absolute|fixed|sticky)$/.test(b)) {
    return "position";
  }
  if (
    /^-?(?:inset|top|right|bottom|left|start|end)(?:-|\/|$)/.test(b) ||
    /^-?(?:inset-x|inset-y|inset-s|inset-e)-/.test(b)
  ) {
    return "position";
  }
  if (/^-?z-/.test(b) || b === "z-auto") {
    return "position";
  }

  // --- Layout ---
  if (
    /^(?:flex|inline-flex|grid|inline-grid|subgrid|masonry)(?:$|-)/.test(b) ||
    /^(?:items|justify|justify-items|justify-self|content|self|place|place-content|place-items|place-self)-/.test(
      b,
    ) ||
    /^-?(?:gap|space-[xy]|col-|row-|grid-|auto-cols|auto-rows|order-|order$)/.test(b) ||
    /^-?(?:auto-flow|grid-flow)-/.test(b) ||
    /^(?:columns-|break-after|break-before|break-inside)-/.test(b) ||
    /^(?:float|clear)-/.test(b) ||
    /^(?:wrap-|flex-wrap|flex-nowrap|flex-row|flex-col|flex-auto|flex-initial|flex-none|flex-1|flex-\[)/.test(
      b,
    ) ||
    /^container$/.test(b)
  ) {
    return "layout";
  }

  // --- Sizing ---
  if (
    /^-?(?:w|h|min-w|max-w|min-h|max-h|size|aspect|shrink|grow|basis)-/.test(b) ||
    /^(?:shrink|grow)(?:$|-)/.test(b) ||
    /^-?overflow-/.test(b) ||
    /^-?object-/.test(b)
  ) {
    return "sizing";
  }

  // --- Spacing (margin / padding only; gap lives in layout) ---
  if (/^-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me)-/.test(b)) {
    return "spacing";
  }

  // --- Shape & border (no `outline-*` — see Shadow; outline paints in the overlay pass) ---
  if (
    /^-?(?:rounded|border|ring|divide|inset-ring)(?:-|\/|$)/.test(b) ||
    /^(?:rounded|border|ring|divide|inset-ring)$/.test(b) ||
    /^ring-offset-/.test(b)
  ) {
    return "shape";
  }

  // --- Background & fill ---
  if (
    /^-?bg-/.test(b) ||
    /^(?:from|via|to)(?:-|\/|$)/.test(b) ||
    /^bg-(?:linear|radial|conic)-/.test(b) ||
    /^-?mask-/.test(b) ||
    /^-?(?:fill|stroke)-/.test(b)
  ) {
    return "background";
  }

  // --- Shadow & depth (includes `outline-*` — same paint phase as box-shadow overlay) ---
  if (
    /^-?(?:shadow|inset-shadow|drop-shadow|text-shadow)(?:-|\/|$)/.test(b) ||
    /^(?:shadow|inset-shadow)$/.test(b) ||
    /^-?outline(?:-|\/|$)/.test(b) ||
    /^outline$/.test(b)
  ) {
    return "shadow";
  }

  // --- Typography ---
  if (
    /^-?(?:font|leading|tracking|list|indent|align|decoration|underline-offset|text-wrap|text-balance|text-pretty)-/.test(
      b,
    ) ||
    /^-?(?:text-(?!shadow))/.test(b) ||
    /^-?(?:whitespace|break|line-clamp|hyphens)-/.test(b) ||
    /^(?:antialiased|subpixel-antialiased|italic|not-italic|overline|line-through|underline|no-underline|uppercase|lowercase|capitalize|normal-case|truncate|text-wrap|text-balance|text-pretty)$/.test(
      b,
    ) ||
    /^text-wrap-/.test(b) ||
    /^tabular-nums$|^slashed-zero$|^lining-nums$|^oldstyle-nums$|^proportional-nums$/.test(b)
  ) {
    return "typography";
  }

  // --- Composite & transforms (GPU / filter stack) ---
  if (
    /^opacity(?:-|$)/.test(b) ||
    /^mix-blend-/.test(b) ||
    /^isolation(?:-|$)/.test(b) ||
    b === "isolate" ||
    /^transform(?:-(?:gpu|cpu|none))?$/.test(b) ||
    /^-?(?:translate|scale|rotate|skew)-/.test(b) ||
    /^perspective(?:-|$)/.test(b) ||
    b === "transform-3d" ||
    /^blur(?:-|$)/.test(b) ||
    /^backdrop-/.test(b) ||
    /^filter(?:-|$)/.test(b) ||
    /^brightness-/.test(b) ||
    /^contrast-/.test(b) ||
    /^grayscale(?:-|$)/.test(b) ||
    /^hue-rotate-/.test(b) ||
    /^invert(?:-|$)/.test(b) ||
    /^saturate-/.test(b) ||
    /^sepia(?:-|$)/.test(b) ||
    /^will-change/.test(b)
  ) {
    return "composite";
  }

  // --- Motion ---
  if (/^(?:transition|duration|ease|delay|animate)(?:-|$)/.test(b) || /^ease-/.test(b)) {
    return "motion";
  }

  // --- Behavior & interaction ---
  if (
    /^(?:cursor|pointer-events|select|touch|scroll|scroll-m|scroll-p|overscroll|snap|resize|field-sizing|appearance|scheme|color-scheme|accent|caret)(?:-|$)/.test(
      b,
    ) ||
    /^(?:cursor|select|resize)$/.test(b) ||
    /^scroll-behavior/.test(b) ||
    /^scroll-snap/.test(b) ||
    /^touch-action/.test(b) ||
    b === "inert"
  ) {
    return "behavior";
  }

  return "other";
}

/**
 * Arbitrary **parent** selectors (`[&…]`, `[&>a]:…`, slot forms with `&` inside the bracket)
 * scope utilities to descendants — bucket as `selector` so they chunk apart from base layout/typography
 * and are labeled distinctly from interactive `state` variants (`hover:`, `data-[…]:`, …).
 * Pure arbitrary **properties** (`[--x]:`, `[color:red]`) have no `&` in the leading `[…]` segment.
 */
function isArbitraryParentSelectorStateToken(token: string): boolean {
  if (/^\[&/.test(token)) {
    return true;
  }
  if (!token.startsWith("[")) {
    return false;
  }
  const colonIdx = indexOfFirstVariantColon(token);
  if (colonIdx === -1 || colonIdx === 0 || token[colonIdx - 1] !== "]") {
    return false;
  }
  const selector = token.slice(0, colonIdx);
  return selector.includes("&");
}

/**
 * @since 0.3.16-canary.0
 */
export function classifyToken(token: string): Bucket {
  // Before `[` arbitrary-property handling and `isStateToken`, parent-selector tokens must
  // be `selector` so they flush into their own chunk after unconditional utilities.
  if (isArbitraryParentSelectorStateToken(token)) {
    return "selector";
  }
  if (isSelectorVariantToken(token)) {
    return "selector";
  }

  if (/^@container(?:\/[a-z][a-z0-9-]*)?$/i.test(token)) {
    return "existence";
  }

  if (token.startsWith("[")) {
    const splitIdx = indexOfFirstVariantColon(token);
    if (splitIdx === -1) {
      return "arbitrary";
    }
    if (splitIdx === 0 || token[splitIdx - 1] !== "]") {
      return "arbitrary";
    }
  }

  const outer = firstLeadingVariantPrefix(token);
  if (outer === "starting") {
    return "starting";
  }

  if (isStateToken(token)) {
    return "state";
  }

  const bareUtility = stripVariants(token);
  return classifyBareUtility(bareUtility);
}

/**
 * Stable key for `data-[…]` variants so unrelated selectors stay split, while
 * **branching on the full bracket** (e.g. `data-[vaul-drawer-direction=bottom]`
 * vs `=left`) keeps direction-specific utilities in separate state groups.
 */
function dataAttributeStem(token: string): string {
  const match = token.match(/^data-\[([^\]]*)\]/);
  return match ? `data-[${match[1]}]` : "data";
}

/**
 * Same idea as {@link dataAttributeStem} for `aria-[…]:` variants.
 */
function ariaAttributeStem(token: string): string {
  const match = token.match(/^aria-\[([^\]]*)\]/);
  return match ? `aria-[${match[1]}]` : "aria";
}

/**
 * `in-data-[…]:` — normalize on the full bracket expression like {@link dataAttributeStem}.
 */
function inDataAttributeStem(token: string): string {
  const match = token.match(/^in-data-\[([^\]]*)\]/);
  return match ? `in-data-[${match[1]}]` : "in-data";
}

/**
 * Stable key for splitting adjacent `state` / `starting` tokens in {@link suggestCnGroups}
 * (`selector` uses {@link selectorKey}).
 * Uses the **full variant stack** (every `:` segment outside `[…]`), not only the
 * outermost prefix, so `@md/foo:[&>*]:w-auto` and `@md/foo:has-[…]:mt-px` stay in
 * separate groups while `hover:opacity` still keys as `hover` + `opacity`…
 *
 * `data-[…]` / `aria-[…]` normalize the first segment via {@link dataAttributeStem} /
 * {@link ariaAttributeStem} (full token required for bracket capture).
 *
 * @since 0.3.16-canary.0
 */
export function stateKey(token: string): string {
  const layers: Array<string> = [];
  let rest = token;
  while (rest.length > 0) {
    const colonIdx = indexOfFirstVariantColon(rest);
    if (colonIdx === -1) {
      break;
    }
    layers.push(rest.slice(0, colonIdx));
    rest = rest.slice(colonIdx + 1);
  }
  if (layers.length === 0) {
    return token;
  }
  const firstLayer = layers[0];
  if (firstLayer === undefined) {
    return token;
  }
  if (firstLayer.startsWith("data-[")) {
    layers[0] = dataAttributeStem(token);
  } else if (firstLayer.startsWith("aria-[")) {
    layers[0] = ariaAttributeStem(token);
  } else if (firstLayer.startsWith("in-data-[")) {
    layers[0] = inDataAttributeStem(token);
  }
  return layers.join("\u001f");
}

const SELECTOR_KEY_SEP = "\u001f";

/**
 * Variant key for {@link Bucket} `"selector"` tokens in {@link suggestCnGroups}.
 * Reuses {@link stateKey} layer splitting, then normalizes common shadcn/Radix SVG patterns so
 * `[&_svg]:…` and `[&_svg:not([class*='size-'])]:…` stay in one chunk.
 *
 * @since 0.3.16-canary.0
 */
export function selectorKey(token: string): string {
  return stateKey(token)
    .split(SELECTOR_KEY_SEP)
    .map(normalizeSelectorVariantLayer)
    .join(SELECTOR_KEY_SEP);
}

function normalizeSelectorVariantLayer(layer: string): string {
  if (layer === "[&_svg:not([class*='size-'])]") {
    return "[&_svg]";
  }
  return layer;
}

/**
 * @since 0.3.16-canary.0
 */
export function bucketsCompatible(a: Bucket, b: Bucket): boolean {
  if (a === b) {
    return true;
  }
  return COMPATIBLE_BUCKET_SETS.some((bucketSet) => bucketSet.has(a) && bucketSet.has(b));
}

/**
 * Like {@link bucketsCompatible}, but never merge two distinct state / starting / selector variant blobs.
 *
 * @since 0.3.16-canary.0
 */
export function bucketsMergeCompatible(a: Bucket, b: Bucket): boolean {
  if (a === "state" && b === "state") {
    return false;
  }
  if (a === "starting" && b === "starting") {
    return false;
  }
  if (a === "selector" && b === "selector") {
    return false;
  }
  if (a === "arbitrary" || b === "arbitrary") {
    return false;
  }
  return bucketsCompatible(a, b);
}
