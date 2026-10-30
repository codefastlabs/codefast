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
  readonly merged: string;
  /** Caller classes merged onto this selection that it did not remember, counted until it settles its prefix. */
  misses: number;
  /** Caller classes seen at least twice, keyed by the class string as passed. */
  pairs: Map<string, string> | null;
  /** What a caller's class merges onto once settled: the merged answer when that is exact, the joined text otherwise. */
  prefix: string | null;
}

/**
 * Whether a caller's class string has been seen before by this resolver, marking it seen.
 */
export type ClassDoor = (className: string) => boolean;

/** Slots in a class door; a power of two, so a hash masks straight to one. */
const DOOR_SLOTS = 256;

/** Caller classes a selection merges before it settles its prefix, so a selection meeting one or two never pays to. */
const PREFIX_AFTER_MISSES = 4;

/** Caller classes one selection remembers, so a selection the store keeps promoting cannot grow without bound. */
const PAIR_LIMIT = 64;

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
 * @remarks `merged` is the selection's answer when the store already holds it, and `undefined` when it does not.
 */
export const createFlatSelection = (
  plan: VariantPlan,
  variantProps: Record<string, unknown>,
  merged: string | undefined,
): FlatSelection => {
  const joined = joinVariantClasses(plan, variantProps);
  const mergeClasses = plan.mergeClasses;

  return {
    joined,
    merged:
      merged !== undefined ? merged : joined === "" ? joined : mergeClasses === null ? joined : mergeClasses(joined),
    misses: 0,
    pairs: null,
    prefix: null,
  };
};

/**
 * Whether merging dropped nothing but repeats, which makes the merged answer as good a prefix as the joined text.
 *
 * @remarks Split on single spaces: a token the engine re-spaced reads as dropped, which only keeps the joined text.
 */
const dropsOnlyRepeats = (joined: string, merged: string): boolean => {
  const kept = new Set(merged.split(" "));

  for (const token of joined.split(" ")) {
    if (token !== "" && !kept.has(token)) {
      return false;
    }
  }

  return true;
};

/**
 * Resolves a selection with a caller's class string appended, remembering the answer from the class's second sighting.
 *
 * @remarks A caller's class merges onto the merged answer only when merging dropped nothing but repeats:
 * the engine's conflicts are not transitive, so a class one merge drops can come back once a caller's
 * class overrides what dropped it. That check runs once a selection has met a few classes, where the
 * shorter merges repay it.
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

  const mergeClasses = plan.mergeClasses;
  let prefix = selection.prefix;

  if (prefix === null) {
    prefix = selection.joined;

    if (mergeClasses === twMerge && ++selection.misses === PREFIX_AFTER_MISSES) {
      const merged = selection.merged;

      prefix = dropsOnlyRepeats(prefix, merged) ? merged : prefix;
      selection.prefix = prefix;
    }
  }

  const text = prefix === "" ? className : prefix + " " + className;

  if (mergeClasses === null) {
    return text;
  }

  const merged = mergeClasses(text);

  if (door(className) && (pairs === null || pairs.size < PAIR_LIMIT)) {
    (selection.pairs ??= new Map()).set(className, merged);
    cache.charge();
  }

  return merged;
};
