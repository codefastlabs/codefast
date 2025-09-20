/**
 * Test Properties
 *
 * Test data sets used for benchmarking different variant scenarios
 */

// Test data for simple variants
export const simpleTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg" } as const,
  { className: "custom-class", size: "sm", variant: "outline" } as const,
  { size: "icon", variant: "ghost" } as const,
  { className: "custom-class", variant: "link" } as const,
];

// Test data for complex variants
export const complexTestProps = [
  {} as const,
  { size: "lg", variant: "destructive" } as const,
  { disabled: true, loading: true } as const,
  { disabled: false, size: "sm", variant: "outline" } as const,
  { loading: true, size: "icon", variant: "ghost" } as const,
  { className: "custom-class", disabled: true, variant: "link" } as const,
];
