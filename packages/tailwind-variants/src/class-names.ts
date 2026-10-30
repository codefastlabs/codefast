/**
 * The class-name utilities this package exposes to consumers, independent of variants.
 */

import { twMerge } from "tailwind-merge";

import type { ClassMerger, ClassValue } from "#types";

/**
 * One class value flattened to the classes it contributes.
 *
 * @remarks Deliberately identical to clsx, which this replaced so the package ships no runtime
 * dependency of its own — including the corners its own types disagree with: a `bigint` contributes
 * nothing despite being a `ClassValue`, and an object's keys are read with `for…in`, so an
 * inherited enumerable one counts.
 */
const flattenClassValue = (value: ClassValue): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value !== "object" || value === null) {
    return "";
  }

  let text = "";

  if (Array.isArray(value)) {
    return appendClassValues(text, value, 0);
  }

  for (const key in value) {
    if (value[key]) {
      text = text ? text + " " + key : key;
    }
  }

  return text;
};

/** Appends what each class value from `start` on contributes, in order, so no caller ever re-joins a prefix. */
const appendClassValues = (text: string, classes: ReadonlyArray<ClassValue>, start: number): string => {
  let result = text;

  for (let index = start; index < classes.length; index++) {
    const value = classes[index];

    if (!value) {
      continue;
    }

    const part = typeof value === "string" ? value : flattenClassValue(value);

    if (part) {
      result = result ? result + " " + part : part;
    }
  }

  return result;
};

/**
 * Flatten every class value a caller passed, dropping the ones that contribute nothing.
 *
 * @since 0.6.0
 */
export const flattenClassValues = (classes: ReadonlyArray<ClassValue>): string => appendClassValues("", classes, 0);

/**
 * Combine CSS classes.
 *
 * @remarks Joins in one pass: a value that is not a string continues the join rather than restarting it.
 *
 * @since 0.3.16-canary.0
 */
export const cx = (...classes: Array<ClassValue>): string => {
  let text = "";

  for (let index = 0; index < classes.length; index++) {
    const value = classes[index];

    if (typeof value === "string") {
      if (value) {
        text = text ? text + " " + value : value;
      }
    } else if (value) {
      return appendClassValues(text, classes, index);
    }
  }

  return text;
};

/** Pair entries one generation of a merged `cn`'s memo holds before it is retired. */
const PAIR_GENERATION_LIMIT = 512;
/** Second classes remembered per first class, so one base with a stream of distinct overrides cannot fill the memo. */
const PAIR_BUCKET_LIMIT = 8;

/**
 * Creates a `cn` that merges through `mergeClasses`, answering a repeated pair of strings from a memo.
 *
 * @remarks Most calls pass a static class list and the caller's `className`. Keying the memo on those
 * two strings as passed, rather than on their join, hashes nothing new on a hit: a freshly joined
 * key is what the merge engine's own cache pays to look up. A first class earns a bucket only on its
 * second sighting, so a stream of one-off calls allocates nothing. The memo assumes `mergeClasses` is
 * a pure function of its input, as every merge engine's own cache does.
 */
export const createMergingCn = (mergeClasses: ClassMerger): ((...classes: Array<ClassValue>) => string) => {
  // `null` marks a first class seen once and not yet given a bucket.
  let current = new Map<string, Map<string, string> | null>();
  let previous: Map<string, Map<string, string> | null> | null = null;
  let entries = 0;

  const remember = (first: string, bucket: Map<string, string> | null): void => {
    current.set(first, bucket);

    if (++entries > PAIR_GENERATION_LIMIT) {
      previous = current;
      current = new Map();
      entries = 0;
    }
  };

  const mergePair = (first: string, second: string): string => {
    let bucket = current.get(first);

    if (bucket === undefined) {
      const retired = previous?.get(first);

      if (retired === undefined) {
        remember(first, null);

        return mergeClasses(first + " " + second);
      }

      bucket = retired;
      remember(first, bucket);
    }

    if (bucket === null) {
      bucket = new Map();
      current.set(first, bucket);
    }

    const hit = bucket.get(second);

    if (hit !== undefined) {
      return hit;
    }

    const merged = mergeClasses(first + " " + second);

    if (bucket.size < PAIR_BUCKET_LIMIT) {
      bucket.set(second, merged);
      remember(first, bucket);
    }

    return merged;
  };

  return (...classes: Array<ClassValue>): string => {
    let first = "";
    let second = "";
    let rest = "";
    let count = 0;

    for (let index = 0; index < classes.length; index++) {
      const value = classes[index];

      if (typeof value === "string") {
        if (value) {
          if (count === 0) {
            first = value;
          } else if (count === 1) {
            second = value;
          } else {
            rest = rest ? rest + " " + value : value;
          }

          count++;
        }
      } else if (value) {
        const text =
          count === 0 ? "" : count === 1 ? first : rest ? first + " " + second + " " + rest : first + " " + second;

        return mergeClasses(appendClassValues(text, classes, index));
      }
    }

    if (count === 0) {
      return "";
    }

    if (count === 1) {
      // A caller's own string keeps its hash, so the merge engine's cache answers it without a memo of ours.
      return mergeClasses(first);
    }

    return count === 2 ? mergePair(first, second) : mergeClasses(first + " " + second + " " + rest);
  };
};

/**
 * Combine CSS classes and resolve Tailwind conflicts between them.
 *
 * @since 0.3.16-canary.0
 */
export const cn: (...classes: Array<ClassValue>) => string = createMergingCn(twMerge);
