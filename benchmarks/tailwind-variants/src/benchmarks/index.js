/**
 * Benchmarks Module Exports
 *
 * Explicit named exports for all benchmark scenarios
 * This provides better tree-shaking, IDE support, and maintainability
 */

// Simple and complex variant benchmarks
export { createComplexWithMergeBenchmark } from "#benchmarks/complex/with-merge.js";
export { createComplexWithoutMergeBenchmark } from "#benchmarks/complex/without-merge.js";
export { createSimpleWithMergeBenchmark } from "#benchmarks/simple/with-merge.js";
export { createSimpleWithoutMergeBenchmark } from "#benchmarks/simple/without-merge.js";

// Slots benchmarks
export { createSlotsWithMergeBenchmark } from "#benchmarks/slots/with-merge.js";
export { createSlotsWithoutMergeBenchmark } from "#benchmarks/slots/without-merge.js";

// Compound slots benchmarks
export { createCompoundSlotsWithMergeBenchmark } from "#benchmarks/compound-slots/with-merge.js";
export { createCompoundSlotsWithoutMergeBenchmark } from "#benchmarks/compound-slots/without-merge.js";

// Configuration extension benchmarks
export { createExtendsWithMergeBenchmark } from "#benchmarks/extends/with-merge.js";
export { createExtendsWithoutMergeBenchmark } from "#benchmarks/extends/without-merge.js";

// Global factory benchmarks
export { createCreateTVWithMergeBenchmark } from "#benchmarks/create-tv/with-merge.js";
export { createCreateTVWithoutMergeBenchmark } from "#benchmarks/create-tv/without-merge.js";

// Extreme stress test benchmarks
export { createExtremeSlotsWithMergeBenchmark } from "#benchmarks/extreme/slots-with-merge.js";
export { createExtremeSlotsWithoutMergeBenchmark } from "#benchmarks/extreme/slots-without-merge.js";
export { createExtremeWithMergeBenchmark } from "#benchmarks/extreme/with-merge.js";
export { createExtremeWithoutMergeBenchmark } from "#benchmarks/extreme/without-merge.js";
