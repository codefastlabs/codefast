/**
 * Benchmarks Module Exports
 *
 * Explicit named exports for all benchmark scenarios
 * This provides better tree-shaking, IDE support, and maintainability
 */

export { createComplexWithMergeBenchmark } from "./complex/with-merge";
export { createComplexWithoutMergeBenchmark } from "./complex/without-merge";
export { createSimpleWithMergeBenchmark } from "./simple/with-merge";
export { createSimpleWithoutMergeBenchmark } from "./simple/without-merge";
