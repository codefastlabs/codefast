// =============================================================================
// Main Entry Point - Re-export from modular structure
// =============================================================================

// Core functions
export { createTV, tv } from "./tv";
export { cx } from "./utils";

// Type definitions
export type {
  ClassValue,
  Config,
  ConfigVariants,
  ConfigWithSlots,
  SlotProps,
  SlotSchema,
  TVConfig,
  VariantProps,
} from "./types";
