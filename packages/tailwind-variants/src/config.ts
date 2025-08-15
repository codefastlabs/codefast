import type { ConfigExtension } from "tailwind-merge";

export type MergeConfig = ConfigExtension<string, string>;

export interface TWMConfig {
  /**
   * Whether to merge the class names with `tailwind-merge` library.
   * It's avoid to have duplicate tailwind classes. (Recommended)
   * @see https://github.com/dcastil/tailwind-merge/blob/v2.2.0/README.md
   * @default true
   */
  twMerge?: boolean;
  /**
   * The config object for `tailwind-merge` library.
   * @see https://github.com/dcastil/tailwind-merge/blob/v2.2.0/docs/configuration.md
   */
  twMergeConfig?: MergeConfig;
}

export type TVConfig = TWMConfig;
