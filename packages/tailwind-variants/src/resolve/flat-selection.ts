/**
 * What a resolver remembers for one selection of a configuration without slots, and for the classes callers add to it.
 */

import { twMerge } from "cn";

import type { VariantPlan } from "#compile/plan";
import type { ResolutionCache } from "#resolve/cache";
import { joinVariantClasses } from "#resolve/variants";

/**
 * One selection's classes, joined and merged once, with the caller classes it has met twice.
 */
export interface FlatSelection {
  readonly joined: string;
  readonly merged: string | undefined;
  /** Caller classes seen at least twice, keyed by the class string as passed. */
  pairs: Map<string, string> | null;
  /** What a caller's class is merged onto, worked out the first time one arrives. */
  prefix: string | null;
}

/**
 * Whether a caller's class string has been seen before by this resolver, marking it seen.
 */
export type ClassDoor = (className: string) => boolean;

/** Slots in a class door; a power of two, so a hash masks straight to one. */
const DOOR_SLOTS = 1024;

const WHITESPACE = /\s+/;

/**
 * Creates a bounded door that lets a class string be remembered only from its second sighting.
 *
 * @remarks A collision only admits a class one sighting early, which costs a stored pair and nothing else.
 */
export const createClassDoor = (): ClassDoor => {
  // Allocated on the first caller class, so a resolver nobody passes one to never pays for it.
  let seen: Int32Array | null = null;

  return (className: string): boolean => {
    seen ??= new Int32Array(DOOR_SLOTS);

    let hash = 0x811c9dc5;

    for (let index = 0; index < className.length; index++) {
      hash = Math.imul(hash ^ className.charCodeAt(index), 0x01000193);
    }

    // Never zero, so an empty slot always reads as unseen.
    hash |= 1;

    const slot = hash & (DOOR_SLOTS - 1);

    if (seen[slot] === hash) {
      return true;
    }

    seen[slot] = hash;

    return false;
  };
};

/**
 * Resolves a selection's classes once, joined and merged, reusing a merge already worked out.
 *
 * @remarks `merged` is the selection's answer when the store already holds it — `null` for no
 * classes — and `undefined` when it does not.
 */
export const createFlatSelection = (
  plan: VariantPlan,
  variantProps: Record<string, unknown>,
  merged: string | null | undefined,
): FlatSelection => {
  const joined = joinVariantClasses(plan, variantProps);
  const mergeClasses = plan.mergeClasses;

  return {
    joined,
    merged:
      merged !== undefined
        ? (merged ?? undefined)
        : joined === ""
          ? undefined
          : mergeClasses === null
            ? joined
            : mergeClasses(joined),
    pairs: null,
    prefix: null,
  };
};

/** Whether merging dropped nothing but repeats, which is when the merged text stands in for the joined one. */
const dropsOnlyRepeats = (joined: string, merged: string): boolean => {
  const kept = new Set(merged.split(WHITESPACE));

  for (const token of joined.split(WHITESPACE)) {
    if (token !== "" && !kept.has(token)) {
      return false;
    }
  }

  return true;
};

/**
 * Resolves a selection with a caller's class string appended, remembering the answer from the class's second sighting.
 *
 * @remarks A merged prefix stands in for the joined text only when merging it dropped
 * nothing but repeats: a dropped class can otherwise come back once the caller's class overrides what
 * dropped it, and a merge of the whole would keep it.
 */
export const resolveFlatSelectionWithClass = (
  plan: VariantPlan,
  cache: Pick<ResolutionCache<unknown>, "charge">,
  door: ClassDoor,
  selection: FlatSelection,
  className: string,
): string => {
  const pairs = selection.pairs;

  if (pairs !== null) {
    const hit = pairs.get(className);

    if (hit !== undefined) {
      return hit;
    }
  }

  const joined = selection.joined;
  const mergeClasses = plan.mergeClasses;

  if (mergeClasses === null) {
    return joined === "" ? className : joined + " " + className;
  }

  let merged: string;

  if (mergeClasses === twMerge) {
    let prefix = selection.prefix;

    if (prefix === null) {
      prefix = selection.merged !== undefined && dropsOnlyRepeats(joined, selection.merged) ? selection.merged : joined;
      selection.prefix = prefix;
    }

    merged = twMerge(prefix === "" ? className : prefix + " " + className);

    if (!door(className)) {
      return merged;
    }
  } else {
    merged = mergeClasses(joined === "" ? className : joined + " " + className);

    if (!door(className)) {
      return merged;
    }
  }

  (selection.pairs ??= new Map()).set(className, merged);
  cache.charge();

  return merged;
};
