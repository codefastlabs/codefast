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
  createCompoundSlotsWithMergeBenchmark,
  createCompoundSlotsWithoutMergeBenchmark,
  createCreateTVWithMergeBenchmark,
  createCreateTVWithoutMergeBenchmark,
  createExtendsWithMergeBenchmark,
  createExtendsWithoutMergeBenchmark,
  createSimpleWithMergeBenchmark,
  createSimpleWithoutMergeBenchmark,
  createSlotsWithMergeBenchmark,
  createSlotsWithoutMergeBenchmark,
} from "./benchmarks/index.js";
import { generatePerformanceSummary } from "./utils/index.js";

/**
 * Main function to run all benchmarks
 */
async function main() {
  try {
    console.log("🚀 Starting Tailwind Variants Performance Benchmark");
    console.log("═══════════════════════════════════════════════════\n");

    console.log("Starting Tailwind Variants Performance Benchmark...\n");

    // Create all benchmark scenarios
    const simpleWithoutMergeBench = createSimpleWithoutMergeBenchmark();
    const simpleWithMergeBench = createSimpleWithMergeBenchmark();
    const complexWithoutMergeBench = createComplexWithoutMergeBenchmark();
    const complexWithMergeBench = createComplexWithMergeBenchmark();
    const slotsWithoutMergeBench = createSlotsWithoutMergeBenchmark();
    const slotsWithMergeBench = createSlotsWithMergeBenchmark();
    const compoundSlotsWithoutMergeBench = createCompoundSlotsWithoutMergeBenchmark();
    const compoundSlotsWithMergeBench = createCompoundSlotsWithMergeBenchmark();
    const extendsWithoutMergeBench = createExtendsWithoutMergeBenchmark();
    const extendsWithMergeBench = createExtendsWithMergeBenchmark();
    const createTVWithoutMergeBench = createCreateTVWithoutMergeBenchmark();
    const createTVWithMergeBench = createCreateTVWithMergeBenchmark();

    // Define benchmark suites with progress tracking
    const totalSuites = 12;
    let currentSuite = 0;

    const runBenchmark = async (benchmark, name) => {
      currentSuite++;
      console.log(`▶ [${currentSuite}/${totalSuites}] Running ${name} benchmark...`);
      await benchmark.run();
      console.table(benchmark.table());
      generatePerformanceSummary(benchmark);
      console.log("\n");
    };

    // Run all benchmarks with progress logging and immediate results
    await runBenchmark(simpleWithoutMergeBench, "Simple Variants");
    await runBenchmark(simpleWithMergeBench, "Simple Variants (With Tailwind Merge)");
    await runBenchmark(complexWithoutMergeBench, "Complex Variants");
    await runBenchmark(complexWithMergeBench, "Complex Variants (With Tailwind Merge)");
    await runBenchmark(slotsWithoutMergeBench, "Slots");
    await runBenchmark(slotsWithMergeBench, "Slots (With Tailwind Merge)");
    await runBenchmark(compoundSlotsWithoutMergeBench, "Compound Slots");
    await runBenchmark(compoundSlotsWithMergeBench, "Compound Slots (With Tailwind Merge)");
    await runBenchmark(extendsWithoutMergeBench, "Extends");
    await runBenchmark(extendsWithMergeBench, "Extends (With Tailwind Merge)");
    await runBenchmark(createTVWithoutMergeBench, "CreateTV");
    await runBenchmark(createTVWithMergeBench, "CreateTV (With Tailwind Merge)");

    console.log("\nBenchmark completed!");
    console.log("\n✓ Benchmark completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Benchmark failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
