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
import { generatePerformanceSummary, generateOverallSummary } from "./utils/index.js";

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

    // Run all benchmarks with progress logging
    console.log("Running Simple Variants benchmark...");
    await simpleWithoutMergeBench.run();
    console.log("✓ Simple Variants completed\n");

    console.log("Running Simple Variants (With Tailwind Merge) benchmark...");
    await simpleWithMergeBench.run();
    console.log("✓ Simple Variants (With Tailwind Merge) completed\n");

    console.log("Running Complex Variants benchmark...");
    await complexWithoutMergeBench.run();
    console.log("✓ Complex Variants completed\n");

    console.log("Running Complex Variants (With Tailwind Merge) benchmark...");
    await complexWithMergeBench.run();
    console.log("✓ Complex Variants (With Tailwind Merge) completed\n");

    console.log("Running Slots benchmark...");
    await slotsWithoutMergeBench.run();
    console.log("✓ Slots completed\n");

    console.log("Running Slots (With Tailwind Merge) benchmark...");
    await slotsWithMergeBench.run();
    console.log("✓ Slots (With Tailwind Merge) completed\n");

    console.log("Running Compound Slots benchmark...");
    await compoundSlotsWithoutMergeBench.run();
    console.log("✓ Compound Slots completed\n");

    console.log("Running Compound Slots (With Tailwind Merge) benchmark...");
    await compoundSlotsWithMergeBench.run();
    console.log("✓ Compound Slots (With Tailwind Merge) completed\n");

    console.log("Running Extends benchmark...");
    await extendsWithoutMergeBench.run();
    console.log("✓ Extends completed\n");

    console.log("Running Extends (With Tailwind Merge) benchmark...");
    await extendsWithMergeBench.run();
    console.log("✓ Extends (With Tailwind Merge) completed\n");

    console.log("Running CreateTV benchmark...");
    await createTVWithoutMergeBench.run();
    console.log("✓ CreateTV completed\n");

    console.log("Running CreateTV (With Tailwind Merge) benchmark...");
    await createTVWithMergeBench.run();
    console.log("✓ CreateTV (With Tailwind Merge) completed\n");

    // Display results for each scenario
    console.log("\n═══ Simple Variants Results ═══");
    console.table(simpleWithoutMergeBench.table());
    generatePerformanceSummary(simpleWithoutMergeBench);

    console.log("\n═══ Simple Variants (With Tailwind Merge) Results ═══");
    console.table(simpleWithMergeBench.table());
    generatePerformanceSummary(simpleWithMergeBench);

    console.log("\n═══ Complex Variants Results ═══");
    console.table(complexWithoutMergeBench.table());
    generatePerformanceSummary(complexWithoutMergeBench);

    console.log("\n═══ Complex Variants (With Tailwind Merge) Results ═══");
    console.table(complexWithMergeBench.table());
    generatePerformanceSummary(complexWithMergeBench);

    console.log("\n═══ Slots Results ═══");
    console.table(slotsWithoutMergeBench.table());
    generatePerformanceSummary(slotsWithoutMergeBench);

    console.log("\n═══ Slots (With Tailwind Merge) Results ═══");
    console.table(slotsWithMergeBench.table());
    generatePerformanceSummary(slotsWithMergeBench);

    console.log("\n═══ Compound Slots Results ═══");
    console.table(compoundSlotsWithoutMergeBench.table());
    generatePerformanceSummary(compoundSlotsWithoutMergeBench);

    console.log("\n═══ Compound Slots (With Tailwind Merge) Results ═══");
    console.table(compoundSlotsWithMergeBench.table());
    generatePerformanceSummary(compoundSlotsWithMergeBench);

    console.log("\n═══ Extends Results ═══");
    console.table(extendsWithoutMergeBench.table());
    generatePerformanceSummary(extendsWithoutMergeBench);

    console.log("\n═══ Extends (With Tailwind Merge) Results ═══");
    console.table(extendsWithMergeBench.table());
    generatePerformanceSummary(extendsWithMergeBench);

    console.log("\n═══ CreateTV Results ═══");
    console.table(createTVWithoutMergeBench.table());
    generatePerformanceSummary(createTVWithoutMergeBench);

    console.log("\n═══ CreateTV (With Tailwind Merge) Results ═══");
    console.table(createTVWithMergeBench.table());
    generatePerformanceSummary(createTVWithMergeBench);

    // Generate overall summary
    const allBenchmarks = new Map([
      ["Simple Variants", simpleWithoutMergeBench],
      ["Simple Variants (With Tailwind Merge)", simpleWithMergeBench],
      ["Complex Variants", complexWithoutMergeBench],
      ["Complex Variants (With Tailwind Merge)", complexWithMergeBench],
      ["Slots", slotsWithoutMergeBench],
      ["Slots (With Tailwind Merge)", slotsWithMergeBench],
      ["Compound Slots", compoundSlotsWithoutMergeBench],
      ["Compound Slots (With Tailwind Merge)", compoundSlotsWithMergeBench],
      ["Extends", extendsWithoutMergeBench],
      ["Extends (With Tailwind Merge)", extendsWithMergeBench],
      ["CreateTV", createTVWithoutMergeBench],
      ["CreateTV (With Tailwind Merge)", createTVWithMergeBench],
    ]);

    generateOverallSummary(allBenchmarks);

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
