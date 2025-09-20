#!/usr/bin/env node

/**
 * Tailwind Variants Benchmark Entry Point
 *
 * This is the main entry point for running the Tailwind Variants performance benchmark.
 * It executes the benchmark suite and outputs results to the console.
 */

import { runBenchmark } from "./tailwind-variants.bench";

/**
 * Main function to run the benchmark
 */
async function main(): Promise<void> {
  try {
    console.log("🚀 Starting Tailwind Variants Performance Benchmark");
    console.log("================================================\n");

    await runBenchmark();

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
