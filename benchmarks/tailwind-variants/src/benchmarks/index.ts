/**
 * Benchmarks Module Exports
 *
 * Explicit named exports for all benchmark scenarios
 * This provides better tree-shaking, IDE support, and maintainability
 */

// Simple and complex variant benchmarks
export { createComplexWithMergeBenchmark } from "./complex/with-merge";
export { createComplexWithoutMergeBenchmark } from "./complex/without-merge";
export { createSimpleWithMergeBenchmark } from "./simple/with-merge";
export { createSimpleWithoutMergeBenchmark } from "./simple/without-merge";

// Slots benchmarks
export { createSlotsWithMergeBenchmark } from "./slots/with-merge";
export { createSlotsWithoutMergeBenchmark } from "./slots/without-merge";

// Compound slots benchmarks
export { createCompoundSlotsWithMergeBenchmark } from "./compound-slots/with-merge";
export { createCompoundSlotsWithoutMergeBenchmark } from "./compound-slots/without-merge";

// Configuration extension benchmarks
export { createExtendsWithMergeBenchmark } from "./extends/with-merge";
export { createExtendsWithoutMergeBenchmark } from "./extends/without-merge";

// Global factory benchmarks
export { createCreateTVWithMergeBenchmark } from "./create-tv/with-merge";
export { createCreateTVWithoutMergeBenchmark } from "./create-tv/without-merge";
