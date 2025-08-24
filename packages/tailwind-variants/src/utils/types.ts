/**
 * Type representing values that can be converted to strings
 */
export type ConvertibleValue = boolean | null | number | string | undefined;

/**
 * Type representing the result of a falsyToString conversion
 */
export type ConversionResult = null | number | string | undefined;

/**
 * Type representing nested arrays with a generic element type
 */
export type NestedArray<T> = (NestedArray<T> | T)[];

/**
 * Type representing arrays that can be merged
 */
export type MergeableArray<T> = (null | T | undefined)[];

/**
 * Type representing the result of merging arrays
 */
export type MergedArray<T> = T[];

/**
 * Type representing objects that can be merged
 */
export type MergeableObject = Record<string, unknown>;

/**
 * Type representing objects that can be checked for emptiness
 */
export type CheckableObject =
  | Record<number, unknown>
  | Record<string, unknown>
  | Record<symbol, unknown>;

/**
 * Type representing objects that can be compared for equality
 */
export type ComparableObject = Record<string, unknown>;

/**
 * Conditional type that determines the merge result type
 * Simplified version for better maintainability
 */
export type MergeResult<BaseType, OverrideType> = {
  [PropertyKey in keyof BaseType | keyof OverrideType]: PropertyKey extends keyof OverrideType
    ? PropertyKey extends keyof BaseType
      ? OverrideType[PropertyKey] extends unknown[]
        ? BaseType[PropertyKey] extends unknown[]
          ? unknown[]
          : OverrideType[PropertyKey]
        : OverrideType[PropertyKey] extends object
          ? BaseType[PropertyKey] extends object
            ? MergeResult<BaseType[PropertyKey], OverrideType[PropertyKey]>
            : OverrideType[PropertyKey]
          : OverrideType[PropertyKey]
      : OverrideType[PropertyKey]
    : PropertyKey extends keyof BaseType
      ? BaseType[PropertyKey]
      : never;
};
