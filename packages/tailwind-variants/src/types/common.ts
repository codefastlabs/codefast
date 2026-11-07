/**
 * Common primitive types, class values, and shared configuration options.
 */

/**
 * Anything accepted where classes are expected.
 *
 * @remarks Declared here so the package carries no runtime dependency of its own; the shape is the one
 * consumers already pass, `bigint` included, though a `bigint` contributes nothing.
 *
 * @since 0.3.16-canary.0
 */
export type ClassValue = ClassArray | ClassDictionary | bigint | boolean | null | number | string | undefined;

/**
 * Class names keyed by the condition that includes them.
 *
 * @since 0.6.0
 */
type ClassDictionary = Record<string, unknown>;

/**
 * Class values nested to any depth.
 *
 * @since 0.6.0
 */
type ClassArray = ReadonlyArray<ClassValue>;

/**
 * A class value with no bare object form, so the only object a slot configuration takes is a map.
 *
 * @since 0.6.0
 */
export type PlainClassValue = ReadonlyArray<PlainClassValue> | bigint | boolean | null | number | string | undefined;

/**
 * A function that resolves Tailwind conflicts in one space-separated class string.
 */
export type ClassMerger = (classes: string) => string;

/**
 * The options that decide how a resolver merges and caches classes.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsOptions {
  /**
   * Answers a repeated variant selection from what the resolver already produced.
   *
   * @remarks Off suits a component whose selections are unique per call, which fill the store for nothing.
   *
   * @defaultValue true
   */
  readonly cacheResolutions?: boolean | undefined;
  /**
   * How every answer resolves Tailwind conflicts: the `cn` engine's `twMerge`, none for `false`, or the given merge.
   *
   * @remarks A function is an `extendTailwindMerge` result from `cn/config` for custom class groups, or another engine.
   *
   * @defaultValue true
   */
  readonly twMerge?: boolean | ClassMerger | undefined;
}

/**
 * The configuration keys a `tv` overload declares absent, so a configuration held in a variable selects it only
 * when it leaves them out, exactly as a fresh literal would.
 */
export type AbsentKeys<Key extends PropertyKey> = { readonly [Name in Key]?: undefined };
