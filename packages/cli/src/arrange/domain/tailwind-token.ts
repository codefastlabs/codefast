import { MAX_STRIP_VARIANT_PASSES } from "#/arrange/domain/constants";

/**
 * Splits a class string into its whitespace-separated tokens.
 *
 * @since 0.3.16-canary.0
 */
export function tokenizeClassString(classString: string): Array<string> {
  return classString.trim().split(/\s+/).filter(Boolean);
}

/**
 * Index of the first `:` that separates a Tailwind variant segment from the rest.
 * Colons inside `[...]` (at positive bracket depth) are ignored so selectors like
 * `[&_a:hover]:text-red-500` split as `[&_a:hover]:` + `text-red-500`.
 *
 * @since 0.3.16-canary.0
 */
export function indexOfFirstVariantColon(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
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

/**
 * Strips every variant prefix off a token, leaving the bare utility name.
 *
 * @remarks
 * `"hover:dark:md:text-sm"` → `"text-sm"`, `"@min-[600px]:flex"` → `"flex"`,
 * `"[&_a:hover]:text-red-500"` → `"text-red-500"`.
 *
 * @since 0.3.16-canary.0
 */
export function stripVariants(token: string): string {
  let withoutVariants = token;
  const maxStripVariantPasses = MAX_STRIP_VARIANT_PASSES;
  for (let i = 0; i < maxStripVariantPasses; i++) {
    const colonIdx = indexOfFirstVariantColon(withoutVariants);
    if (colonIdx === -1) {
      break;
    }
    withoutVariants = withoutVariants.slice(colonIdx + 1);
  }
  return withoutVariants;
}
