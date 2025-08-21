import type { ConfigExtension, DefaultClassGroupIds, DefaultThemeGroupIds } from "tailwind-merge";

/**
 * Represents the configuration options for a utility that merges Tailwind CSS classes
 * and optionally extends its functionality with additional groups or themes.
 *
 * @typeParam AdditionalClassGroupIds - Custom class group identifiers that extend the default class groups.
 * @typeParam AdditionalThemeGroupIds - Custom theme group identifiers that extend the default theme groups.
 */
export type TWMConfig<
  AdditionalClassGroupIds extends string = never,
  AdditionalThemeGroupIds extends string = never,
> = {
  twMerge?: boolean;
  twMergeConfig?: ConfigExtension<
    AdditionalClassGroupIds | DefaultClassGroupIds,
    AdditionalThemeGroupIds | DefaultThemeGroupIds
  >;
};

/**
 * Represents the configuration for a TV component. This type defines
 * an alias to `TWMConfig`, encompassing all the properties and
 * functionality specified by `TWMConfig`.
 *
 * Use this type for scenarios where specific configuration settings
 * related to TV components are required.
 */
export type TVConfig = TWMConfig;
