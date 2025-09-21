/**
 * Test Properties
 *
 * All test data sets used for benchmarking different variant scenarios
 * This provides better organization and maintainability
 */

// =============================================================================
// BASIC VARIANT TEST PROPS
// =============================================================================

// Test data for simple variants
export const simpleTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg" } as const,
  { className: "custom-class", size: "sm", variant: "outline" } as const,
  { size: "icon", variant: "ghost" } as const,
  { className: "custom-class", variant: "link" } as const,
] as const;

// Test data for complex variants
export const complexTestProps = [
  {} as const,
  { size: "lg", variant: "destructive" } as const,
  { disabled: true, loading: true } as const,
  { disabled: false, size: "sm", variant: "outline" } as const,
  { loading: true, size: "icon", variant: "ghost" } as const,
  { className: "custom-class", disabled: true, variant: "link" } as const,
] as const;

// =============================================================================
// SLOTS TEST PROPS
// =============================================================================

// Test data for slots variants
export const slotsTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg", variant: "success" } as const,
  { size: "sm" } as const,
  { size: "sm", variant: "destructive" } as const,
  { size: "lg", variant: "success" } as const,
] as const;

// =============================================================================
// COMPOUND SLOTS TEST PROPS
// =============================================================================

// Test data for compound slots variants
export const compoundSlotsTestProps = [
  {} as const,
  { color: "primary", size: "xs" } as const,
  { color: "secondary", size: "sm" } as const,
  { color: "success", size: "md" } as const,
  { color: "danger", size: "lg" } as const,
  { disabled: true } as const,
  { color: "primary", disabled: true, size: "xs" } as const,
  { color: "danger", disabled: false, size: "lg" } as const,
] as const;

// =============================================================================
// EXTENDS TEST PROPS
// =============================================================================

// Test data for extends variants
export const extendsTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg", variant: "outline" } as const,
  { size: "sm", variant: "secondary" } as const,
  { disabled: true, variant: "ghost" } as const,
  { disabled: false, size: "lg", variant: "link" } as const,
] as const;

// =============================================================================
// MIXED FEATURES TEST PROPS
// =============================================================================

// Test data for mixed features (slots + compound variants)
export const mixedSlotsCompoundTestProps = [
  {} as const,
  { size: "lg", variant: "destructive" } as const,
  { size: "sm", variant: "success" } as const,
  { size: "md" } as const,
  { size: "lg", variant: "default" } as const,
] as const;

// Test data for mixed features (extends + slots)
export const mixedExtendsSlotsTestProps = [
  {} as const,
  { size: "lg", variant: "destructive" } as const,
  { size: "sm", variant: "outline" } as const,
  { disabled: true, variant: "ghost" } as const,
  { disabled: false, size: "md", variant: "secondary" } as const,
] as const;

// Test data for full features benchmark
export const fullFeaturesTestProps = [
  {} as const,
  { disabled: false, size: "lg", variant: "destructive" } as const,
  { disabled: true, size: "sm", variant: "outline" } as const,
  { disabled: false, size: "md", variant: "secondary" } as const,
  { disabled: true, size: "xs", variant: "ghost" } as const,
  { disabled: false, size: "lg", variant: "link" } as const,
] as const;
