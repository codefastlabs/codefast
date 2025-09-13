// =============================================================================
// Main Entry Point - Re-export from modular structure
// =============================================================================

// Core functions
export { createTV, tv } from "@/tv";
export { cn, cx } from "@/utils";

// Type definitions
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
