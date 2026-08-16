/**
 * The class-name utilities this package exposes to consumers, independent of variants.
 */

import type { ConfigExtension } from "tailwind-merge";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type { ClassValue } from "#/types";

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
    for (const item of value) {
      if (!item) {
        continue;
      }

      const part = flattenClassValue(item);

      if (part) {
        text = text === "" ? part : `${text} ${part}`;
      }
    }

    return text;
  }

  for (const key in value) {
    if (value[key]) {
      text = text === "" ? key : `${text} ${key}`;
    }
  }

  return text;
};

/**
 * Flatten every class value a caller passed, dropping the ones that contribute nothing.
 */
export const flattenClassValues = (classes: ReadonlyArray<ClassValue>): string => {
  let text = "";

  for (const value of classes) {
    if (!value) {
      continue;
    }

    const part = flattenClassValue(value);

    if (part) {
      text = text === "" ? part : `${text} ${part}`;
    }
  }

  return text;
};

/**
 * Combine CSS classes.
 *
 * @remarks Takes a string-only fast path and flattens anything else.
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

    return flattenClassValue(single);
  }

  let result = "";

  for (let index = 0; index < length; index++) {
    const classValue = classes[index];

    if (typeof classValue === "string") {
      if (classValue) {
        result = result ? result + " " + classValue : classValue;
      }
    } else if (classValue) {
      return flattenClassValues(classes);
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

    return twMerge(flattenClassValue(single));
  }

  let result = "";

  for (let index = 0; index < length; index++) {
    const classValue = classes[index];

    if (typeof classValue === "string") {
      if (classValue) {
        result = result ? result + " " + classValue : classValue;
      }
    } else if (classValue) {
      return twMerge(flattenClassValues(classes));
    }
  }

  return twMerge(result);
};

/**
 * One merge function per configuration object, because a design system hands the same one to every
 * component and each `extendTailwindMerge` builds its own parsed config and its own cache.
 *
 * @remarks Keyed by identity, so a configuration mutated after first use keeps the merge function
 * it already produced.
 */
const tailwindMergeFnByConfiguration = new WeakMap<ConfigExtension<string, string>, (classes: string) => string>();

/**
 * Creates a Tailwind merge function, extended when the caller supplies a configuration.
 *
 * @since 0.3.16-canary.0
 */
export const createTailwindMergeFn = (
  configuration?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  if (!configuration) {
    return twMerge;
  }

  const existing = tailwindMergeFnByConfiguration.get(configuration);

  if (existing !== undefined) {
    return existing;
  }

  const created = extendTailwindMerge(configuration);

  tailwindMergeFnByConfiguration.set(configuration, created);

  return created;
};
