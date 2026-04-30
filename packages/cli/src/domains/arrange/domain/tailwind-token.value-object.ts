import { MAX_STRIP_VARIANT_PASSES } from "#/domains/arrange/domain/constants.domain";

export function tokenizeClassString(classString: string): string[] {
  return classString.trim().split(/\s+/).filter(Boolean);
}

/**
 * Index of the first `:` that separates a Tailwind variant segment from the rest.
 * Colons inside `[...]` (at positive bracket depth) are ignored so selectors like
 * `[&_a:hover]:text-red-500` split as `[&_a:hover]:` + `text-red-500`.
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

// Strip all variant prefixes to get the bare utility name.
// e.g. "hover:dark:md:text-sm" → "text-sm"
// e.g. "@min-[600px]:flex" → "flex"
// e.g. "[&_a:hover]:text-red-500" → "text-red-500"
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
