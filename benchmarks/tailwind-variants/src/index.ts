#!/usr/bin/env node

/**
 * Tailwind Variants Benchmark Entry Point
 *
 * This is the main entry point for running the Tailwind Variants performance benchmark.
 * It orchestrates all benchmark scenarios and outputs results to the console.
 */

import {
  createComplexWithMergeBenchmark,
  createComplexWithoutMergeBenchmark,
  createSimpleWithMergeBenchmark,
  createSimpleWithoutMergeBenchmark,
} from "./benchmarks";
import { generatePerformanceSummary } from "./utils";

/**
 * Main function to run all benchmarks
 */
async function main(): Promise<void> {
  try {
    console.log("🚀 Starting Tailwind Variants Performance Benchmark");
    console.log("================================================\n");

    console.log("Starting Tailwind Variants Performance Benchmark...\n");

    // Create all benchmark scenarios
    const simpleWithoutMergeBench = createSimpleWithoutMergeBenchmark();
    const simpleWithMergeBench = createSimpleWithMergeBenchmark();
    const complexWithoutMergeBench = createComplexWithoutMergeBenchmark();
    const complexWithMergeBench = createComplexWithMergeBenchmark();

    // Run all benchmarks
    await simpleWithoutMergeBench.run();
    await simpleWithMergeBench.run();
    await complexWithoutMergeBench.run();
    await complexWithMergeBench.run();

    // Display results for each scenario
    console.log("\n=== Simple Variants (Without Tailwind Merge) Results ===");
    console.table(simpleWithoutMergeBench.table());
    generatePerformanceSummary(simpleWithoutMergeBench);

    console.log("\n=== Simple Variants (With Tailwind Merge) Results ===");
    console.table(simpleWithMergeBench.table());
    generatePerformanceSummary(simpleWithMergeBench);

    console.log("\n=== Complex Variants (Without Tailwind Merge) Results ===");
    console.table(complexWithoutMergeBench.table());
    generatePerformanceSummary(complexWithoutMergeBench);

    console.log("\n=== Complex Variants (With Tailwind Merge) Results ===");
    console.table(complexWithMergeBench.table());
    generatePerformanceSummary(complexWithMergeBench);

    console.log("\nBenchmark completed!");
    console.log("\n✅ Benchmark completed successfully!");
    process.exit(0);
  } catch (error: unknown) {
    console.error("❌ Benchmark failed:", error);
    process.exit(1);
  }
}

// Run the benchmark if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
