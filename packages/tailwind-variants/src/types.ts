/**
 * Advanced TypeScript types for tailwind-variants with enhanced type safety
 */

import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

// TailwindMerge config type from tailwind-merge library - use partial to handle optional properties
export type TailwindMergeConfig = Partial<ConfigExtension<string, string>>;

// Configuration types
export interface TVConfig {
  twMerge?: boolean;
  twMergeConfig?: TailwindMergeConfig;
}

// Generic variant schema
export type VariantSchema = Record<string, Record<string, ClassValue>>;

// Slots schema for component variants
export type SlotsSchema = Record<string, ClassValue>;

// Compound variant base structure
export interface CompoundVariantBase {
  class?: ClassValue;
  className?: ClassValue;
}

// Mapped compound variant with proper typing
export type CompoundVariant<V extends VariantSchema> = CompoundVariantBase & {
  [K in keyof V]?: HasBooleanKeys<V[K]> extends true ? boolean | keyof V[K] : keyof V[K];
};

// Compound slots structure
export type CompoundSlots<V extends VariantSchema, S extends SlotsSchema> = {
  class?: ClassValue | Partial<Record<keyof S, ClassValue>>;
  className?: ClassValue | Partial<Record<keyof S, ClassValue>>;
  slots: (keyof S)[];
} & {
  [K in keyof V]?: HasBooleanKeys<V[K]> extends true ? boolean | keyof V[K] : keyof V[K];
};

// Helper types to check if a variant has boolean keys
type HasBooleanKeys<T> =
  T extends Record<string, unknown>
    ? "true" extends keyof T
      ? true
      : "false" extends keyof T
        ? true
        : false
    : false;

// TV Props for basic variant selection with precise boolean type support
export type TVProps<V extends VariantSchema> = {
  [K in keyof V]?: HasBooleanKeys<V[K]> extends true ? boolean | keyof V[K] : keyof V[K];
} & {
  class?: ClassValue;
  className?: ClassValue;
};

// TV Component definition
export interface TVComponent<V extends VariantSchema, S extends SlotsSchema> {
  base?: ClassValue;
  compoundSlots?: CompoundSlots<V, S>[];
  compoundVariants?: CompoundVariant<V>[];
  defaultVariants?: Partial<TVProps<V>>;
  extend?: TVReturnType<VariantSchema, SlotsSchema>;
  slots?: S;
  variants?: V;
}

// Slot function type - callable function that returns CSS classes
export type SlotFunction = (props?: {
  class?: ClassValue;
  className?: ClassValue;
}) => string | undefined;

// Return type for slots-based components
export type SlotsReturnType<S extends SlotsSchema> = {
  [K in keyof S]: SlotFunction;
};

// Main TV return type - supports both simple and slots-based usage
export type TVReturnType<V extends VariantSchema, S extends SlotsSchema> = keyof S extends never
  ? {
      (props?: TVProps<V>): string | undefined;
      variantKeys: (keyof V)[];
    }
  : {
      (props?: TVProps<V>): SlotsReturnType<S> & { base: SlotFunction };
      variantKeys: (keyof V)[];
    };

// Branded type for better type safety
export type Brand<K, T> = K & { __brand: T };

// Enhanced variant keys type
export type VariantKeys<V extends VariantSchema> = (keyof V)[];

// Utility type to extract variant props from a TV component
export type VariantProps<T> = T extends TVReturnType<infer V, SlotsSchema> ? TVProps<V> : never;

// Configuration options for TV function
export interface TVOptions extends TVConfig {
  responsiveVariants?: boolean;
}

export type { ClassValue } from "clsx";
