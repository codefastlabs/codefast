import { COMPATIBLE_BUCKET_SETS, RESPONSIVE_PREFIX, STATE_PREFIXES } from "#lib/arrange/constants";
import type { Bucket } from "#lib/arrange/types";

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

export function tokenizeClassString(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

/**
 * Index of the first `:` that separates a Tailwind variant segment from the rest.
 * Colons inside `[...]` (at positive bracket depth) are ignored so selectors like
 * `[&_a:hover]:text-red-500` split as `[&_a:hover]:` + `text-red-500`.
 */
export function indexOfFirstVariantColon(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "[") {
      depth++;
    } else if (ch === "]") {
      depth = Math.max(0, depth - 1);
    } else if (ch === ":" && depth === 0) {
      return i;
    }
  }
  return -1;
}

// Strip all variant prefixes to get the bare utility name.
// e.g. "hover:dark:md:text-sm" → "text-sm"
// e.g. "@min-[600px]:flex" → "flex"
// e.g. "[&_a:hover]:text-red-500" → "text-red-500"
export function stripVariants(token: string): string {
  let t = token;
  const MAX_PASSES = 12;
  for (let i = 0; i < MAX_PASSES; i++) {
    const colonIdx = indexOfFirstVariantColon(t);
    if (colonIdx === -1) break;
    t = t.slice(colonIdx + 1);
  }
  return t;
}

/** Outermost variant segment: first `:` at bracket depth 0 → text before it. */
function firstLeadingVariantPrefix(token: string): string | undefined {
  const idx = indexOfFirstVariantColon(token);
  if (idx === -1) return undefined;
  return token.slice(0, idx);
}

function isStateToken(token: string): boolean {
  const prefix = firstLeadingVariantPrefix(token);
  if (prefix === undefined) return false;

  if (RESPONSIVE_PREFIX.test(token)) return true;
  if (STATE_PREFIXES.has(prefix)) return true;

  if (prefix.startsWith("data-[")) return true;
  if (prefix.startsWith("aria-[")) return true;
  if (prefix.startsWith("supports-[")) return true;

  if (/^data-(?!\[)/.test(prefix)) return true;
  if (/^aria-/.test(prefix)) return true;

  if (/^(group|peer)-/.test(prefix)) return true;
  if (/^not-/.test(prefix)) return true;

  if (isCompoundOrMediaVariantPrefix(prefix)) return true;

  if (prefix.startsWith("[") && prefix.endsWith("]")) {
    return true;
  }

  return false;
}

export function classifyToken(token: string): Bucket {
  if (/^@container(?:\/[a-z][a-z0-9-]*)?$/i.test(token)) {
    return "layout";
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

  if (isStateToken(token)) {
    return "state";
  }

  const t = stripVariants(token);

  if (
    /^(?:flex|inline-flex|grid|inline-grid|block|inline|hidden|contents|flow-root|table(?:-|$)|list-item)/.test(
      t,
    ) ||
    /^(?:items|justify|content|self|place)-/.test(t) ||
    /^-?(?:gap|space-[xy]|col-|row-|grid-|auto-cols|auto-rows|order-|order$)/.test(t) ||
    /^-?(?:overflow|overscroll|object-|isolate$|isolation-|z-|float-|clear-|columns-|break-)/.test(
      t,
    ) ||
    /^(?:absolute|relative|fixed|sticky|static|container)$/.test(t) ||
    /^(?:wrap-|flex-wrap|flex-nowrap|flex-row|flex-col|flex-auto|flex-initial|flex-none|flex-1|flex-[0-9])/.test(
      t,
    ) ||
    /^(?:subgrid|masonry)$/.test(t) ||
    t === "flex" ||
    t === "grid" ||
    /^(?:peer|group)(?:\/[a-z][a-z0-9-]*)?$/.test(t)
  ) {
    return "layout";
  }

  if (
    /^-?(?:w|h|min-w|max-w|min-h|max-h|size|aspect|shrink|grow|basis)-/.test(t) ||
    t === "shrink" ||
    t === "grow" ||
    /^field-sizing-/.test(t)
  ) {
    return "size";
  }

  if (
    /^-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|inset|top|right|bottom|left|start|end)-/.test(
      t,
    ) ||
    /^-?(?:inset|top|right|bottom|left|start|end)(?:\/|$)/.test(t) ||
    /^-?(?:inset-x|inset-y)-/.test(t)
  ) {
    return "spacing";
  }

  if (
    /^-?(?:rounded|border|ring|divide|bg|from|via|to|fill|stroke|shadow|opacity)(?:-|\/|$)/.test(
      t,
    ) ||
    /^-?(?:backdrop-blur|backdrop-filter|backdrop-|blur|drop-shadow|mix-blend)-/.test(t) ||
    /^(?:inset-shadow|inset-ring|mask-)/.test(t) ||
    t === "border" ||
    t === "rounded" ||
    t === "shadow" ||
    t === "ring" ||
    t === "blur"
  ) {
    return "surface";
  }

  if (
    /^-?(?:text|font|leading|tracking|list|indent|align|whitespace|break|line-clamp|hyphens)-/.test(
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

  if (
    /^(?:transition|duration|ease|delay|animate|will-change)(?:-|$)/.test(t) ||
    /^ease-/.test(t) ||
    /^-?(?:translate|scale|rotate|skew)(?:-|$)/.test(t) ||
    /^transform(?:-(?:gpu|cpu|none))?$/.test(t)
  ) {
    return "motion";
  }

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

/**
 * Stable key for `data-[…]` variants so unrelated selectors stay split, while
 * **branching on the full bracket** (e.g. `data-[vaul-drawer-direction=bottom]`
 * vs `=left`) keeps direction-specific utilities in separate state groups.
 */
function dataAttributeStem(token: string): string {
  const m = token.match(/^data-\[([^\]]*)\]/);
  return m ? `data-[${m[1]}]` : "data";
}

/** Same idea as {@link dataAttributeStem} for `aria-[…]:` variants. */
function ariaAttributeStem(token: string): string {
  const m = token.match(/^aria-\[([^\]]*)\]/);
  return m ? `aria-[${m[1]}]` : "aria";
}

/**
 * Stable key for splitting adjacent `state` tokens in {@link suggestCnGroups}.
 * Uses the **full variant stack** (every `:` segment outside `[…]`), not only the
 * outermost prefix, so `@md/foo:[&>*]:w-auto` and `@md/foo:has-[…]:mt-px` stay in
 * separate groups while `hover:opacity` still keys as `hover` + `opacity`…
 *
 * `data-[…]` / `aria-[…]` normalize the first segment via {@link dataAttributeStem} /
 * {@link ariaAttributeStem} (full token required for bracket capture).
 */
export function stateKey(token: string): string {
  const layers: string[] = [];
  let rest = token;
  while (rest.length > 0) {
    const idx = indexOfFirstVariantColon(rest);
    if (idx === -1) break;
    layers.push(rest.slice(0, idx));
    rest = rest.slice(idx + 1);
  }
  if (layers.length === 0) {
    return token;
  }
  if (layers[0]!.startsWith("data-[")) {
    layers[0] = dataAttributeStem(token);
  } else if (layers[0]!.startsWith("aria-[")) {
    layers[0] = ariaAttributeStem(token);
  }
  return layers.join("\u001f");
}

export function bucketsCompatible(a: Bucket, b: Bucket): boolean {
  if (a === b) return true;
  return COMPATIBLE_BUCKET_SETS.some((s) => s.has(a) && s.has(b));
}

/** Like {@link bucketsCompatible}, but never merge two distinct state variant blobs. */
export function bucketsMergeCompatible(a: Bucket, b: Bucket): boolean {
  if (a === "state" && b === "state") return false;
  if (a === "arbitrary" || b === "arbitrary") return false;
  return bucketsCompatible(a, b);
}
