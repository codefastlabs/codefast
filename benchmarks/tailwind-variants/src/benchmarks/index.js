/**
 * Benchmarks Module Exports
 *
 * Explicit named exports for all benchmark scenarios
 * This provides better tree-shaking, IDE support, and maintainability
 */

// Simple and complex variant benchmarks
export { createComplexWithMergeBenchmark } from "./complex/with-merge.js";
export { createComplexWithoutMergeBenchmark } from "./complex/without-merge.js";
export { createSimpleWithMergeBenchmark } from "./simple/with-merge.js";
export { createSimpleWithoutMergeBenchmark } from "./simple/without-merge.js";

// Slots benchmarks
export { createSlotsWithMergeBenchmark } from "./slots/with-merge.js";
export { createSlotsWithoutMergeBenchmark } from "./slots/without-merge.js";

// Compound slots benchmarks
export { createCompoundSlotsWithMergeBenchmark } from "./compound-slots/with-merge.js";
export { createCompoundSlotsWithoutMergeBenchmark } from "./compound-slots/without-merge.js";

// Configuration extension benchmarks
export { createExtendsWithMergeBenchmark } from "./extends/with-merge.js";
export { createExtendsWithoutMergeBenchmark } from "./extends/without-merge.js";

// Global factory benchmarks
export { createCreateTVWithMergeBenchmark } from "./create-tv/with-merge.js";
export { createCreateTVWithoutMergeBenchmark } from "./create-tv/without-merge.js";
