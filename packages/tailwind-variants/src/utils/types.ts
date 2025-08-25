import type { ClassNameValue } from "tailwind-merge";

// Re-export ClassNameValue for use in other modules
export type { ClassNameValue };

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

// ============================================================================
// BRANDED TYPES FOR TYPE SAFETY
// ============================================================================

/**
 * Branded type for class name strings to prevent mixing with regular strings
 */
export type ClassNameString = string & { readonly __brand: "ClassNameString" };

/**
 * Branded type for merged class name strings
 */
export type MergedClassNameString = string & { readonly __brand: "MergedClassNameString" };

// ============================================================================
// CONDITIONAL TYPES AND MAPPED TYPES
// ============================================================================

/**
 * Conditional type that determines if a type is a function
 */
export type IsFunction<T> = T extends (...args: unknown[]) => unknown ? true : false;

/**
 * Conditional type that determines if a type is an object
 */
export type IsObject<T> = T extends object ? (T extends Array<unknown> ? false : true) : false;

/**
 * Conditional type that determines if a type is a primitive
 */
export type IsPrimitive<T> = T extends string | number | boolean | null | undefined ? true : false;

/**
 * Mapped type that makes all properties readonly
 */
export type ReadonlyObject<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: T[K];
};

// ============================================================================
// TEMPLATE LITERAL TYPES
// ============================================================================

/**
 * Template literal type for class name patterns
 */
export type ClassNamePattern = `${string}-${string}` | `${string}`;

// ============================================================================
// UTILITY TYPES NÂNG CAO
// ============================================================================

/**
 * Utility type that extracts the return type of a function
 */
export type FunctionReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * Utility type that makes a type deeply readonly
 */
export type DeepReadonly<T> = T extends object
  ? T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Utility type that excludes undefined from a type
 */
export type NoUndefined<T> = T extends undefined ? never : T;

// ============================================================================
// TYPE GUARDS AND TYPE PREDICATES
// ============================================================================

/**
 * Type predicate that checks if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type predicate that checks if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Type predicate that checks if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type predicate that checks if a value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Type predicate that checks if a value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Type predicate that checks if a value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

/**
 * Type predicate that checks if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type predicate that checks if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type predicate that checks if a value is a primitive
 */
export function isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  );
}

// ============================================================================
// MERGE TYPES
// ============================================================================

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

/**
 * Advanced merge result type with conditional logic
 */
export type AdvancedMergeResult<
  BaseType extends Record<string, unknown>,
  OverrideType extends Record<string, unknown>
> = {
  [PropertyKey in keyof BaseType | keyof OverrideType]: PropertyKey extends keyof OverrideType
    ? PropertyKey extends keyof BaseType
      ? OverrideType[PropertyKey] extends unknown[]
        ? BaseType[PropertyKey] extends unknown[]
          ? ReadonlyArray<unknown>
          : OverrideType[PropertyKey]
        : OverrideType[PropertyKey] extends Record<string, unknown>
          ? BaseType[PropertyKey] extends Record<string, unknown>
            ? AdvancedMergeResult<BaseType[PropertyKey], OverrideType[PropertyKey]>
            : OverrideType[PropertyKey]
          : OverrideType[PropertyKey]
      : OverrideType[PropertyKey]
    : PropertyKey extends keyof BaseType
      ? BaseType[PropertyKey]
      : never;
};

/**
 * Type for object merging configuration
 */
export type ObjectMergeConfig = {
  readonly immutable?: boolean;
};
