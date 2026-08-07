/**
 * The class-name utilities this package exposes to consumers, independent of variants.
 */

import { clsx } from "clsx";
import type { ConfigExtension } from "tailwind-merge";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type { ClassValue } from "#/types";

/**
 * Combine CSS classes using clsx.
 *
 * @remarks Takes a string-only fast path and falls back to clsx for anything else.
 *
 * @since 0.3.16-canary.0
 */
export const cx = (...classes: Array<ClassValue>): string => {
  const length = classes.length;

  if (length === 0) {
    return "";
  }

  if (length === 1) {
    const single = classes[0];

    if (typeof single === "string") {
      return single;
    }

    if (!single) {
      return "";
    }

    return clsx(single);
  }

  let result = "";

  for (let index = 0; index < length; index++) {
    const classValue = classes[index];

    if (typeof classValue === "string") {
      if (classValue) {
        result = result ? result + " " + classValue : classValue;
      }
    } else if (classValue) {
      return clsx(classes);
    }
  }

  return result;
};

/**
 * Combine CSS classes and resolve Tailwind conflicts between them.
 *
 * @since 0.3.16-canary.0
 */
export const cn = (...classes: Array<ClassValue>): string => {
  const length = classes.length;

  if (length === 0) {
    return "";
  }

  if (length === 1) {
    const single = classes[0];

    if (typeof single === "string") {
      return twMerge(single);
    }

    if (!single) {
      return "";
    }

    return twMerge(clsx(single));
  }

  let result = "";

  for (let index = 0; index < length; index++) {
    const classValue = classes[index];

    if (typeof classValue === "string") {
      if (classValue) {
        result = result ? result + " " + classValue : classValue;
      }
    } else if (classValue) {
      return twMerge(clsx(classes));
    }
  }

  return twMerge(result);
};

/**
 * Create a Tailwind merge function, extended when the caller supplies a configuration.
 *
 * @since 0.3.16-canary.0
 */
export const createTailwindMergeFn = (
  configuration?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return configuration ? extendTailwindMerge(configuration) : twMerge;
};
