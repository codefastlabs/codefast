import type {
  ClassNameValue,
  ConfigExtension,
  DefaultClassGroupIds,
  DefaultThemeGroupIds,
} from "tailwind-merge";

import { extendTailwindMerge, twMerge } from "tailwind-merge";

import { isEmptyObject } from "./utils";

/**
 * Creates a tailored class name merging function based on the provided configuration.
 *
 * This utility allows you to extend or override the default Tailwind class group and theme group configurations
 * to produce a customized merging function. Depending on whether the configuration is empty, it uses either
 * the default merging logic or an extended one based on the provided configuration.
 *
 * @typeParam AdditionalClassGroupIds - An optional type parameter to define additional class group identifiers that extend the default ones.
 * @typeParam AdditionalThemeGroupIds - An optional type parameter to define additional theme group identifiers that extend the default ones.
 * @param config - An object that extends the default class and theme group configurations, determining how class name conflicts are resolved.
 * @returns A function that accepts class name inputs and resolves conflicts based on the extended or default configurations.
 */
export const createTwMerge = <
  AdditionalClassGroupIds extends string = string,
  AdditionalThemeGroupIds extends string = string,
>(
  config: ConfigExtension<
    AdditionalClassGroupIds | DefaultClassGroupIds,
    AdditionalThemeGroupIds | DefaultThemeGroupIds
  >,
): ((...classes: ClassNameValue[]) => string) => {
  // Determine which merge function to use based on config
  const mergeFunction = isEmptyObject(config) ? twMerge : extendTailwindMerge(config);

  // Create the class name merger function
  const classNameMerger = (...classes: ClassNameValue[]): string => {
    return mergeFunction(...classes);
  };

  return classNameMerger;
};
