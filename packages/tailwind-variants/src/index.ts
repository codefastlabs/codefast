/**
 * Tailwind Variants - Main Entry Point
 *
 * This module serves as the main entry point for the Tailwind Variants library,
 * providing a clean API for creating type-safe variant systems with Tailwind CSS.
 */

// Core variant functions
export { createTV, tv } from "@/tv";

// Utility functions for class manipulation
export { cn, cx } from "@/utils";

// Type definitions for TypeScript support
export type {
  ClassValue,
  CompoundVariant,
  Config,
  ConfigSchema,
  ConfigVariants,
  ConfigWithSlots,
  SlotProps,
  SlotSchema,
  TVConfig,
  TVFactory,
  TVFactoryResult,
  VariantFunction,
  VariantProps,
} from "@/types";
