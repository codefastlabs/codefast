/**
 * Benchmarks Module Exports
 *
 * Explicit named exports for all benchmark scenarios
 * This provides better tree-shaking, IDE support, and maintainability
 */

// Simple and complex variant benchmarks
export { createComplexWithMergeBenchmark } from "@/benchmarks/complex/with-merge";
export { createComplexWithoutMergeBenchmark } from "@/benchmarks/complex/without-merge";
export { createSimpleWithMergeBenchmark } from "@/benchmarks/simple/with-merge";
export { createSimpleWithoutMergeBenchmark } from "@/benchmarks/simple/without-merge";

// Slots benchmarks
export { createSlotsWithMergeBenchmark } from "@/benchmarks/slots/with-merge";
export { createSlotsWithoutMergeBenchmark } from "@/benchmarks/slots/without-merge";

// Compound slots benchmarks
export { createCompoundSlotsWithMergeBenchmark } from "@/benchmarks/compound-slots/with-merge";
export { createCompoundSlotsWithoutMergeBenchmark } from "@/benchmarks/compound-slots/without-merge";

// Configuration extension benchmarks
export { createExtendsWithMergeBenchmark } from "@/benchmarks/extends/with-merge";
export { createExtendsWithoutMergeBenchmark } from "@/benchmarks/extends/without-merge";

// Global factory benchmarks
export { createCreateTVWithMergeBenchmark } from "@/benchmarks/create-tv/with-merge";
export { createCreateTVWithoutMergeBenchmark } from "@/benchmarks/create-tv/without-merge";
