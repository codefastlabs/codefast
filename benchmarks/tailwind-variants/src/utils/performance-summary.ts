/**
 * Performance Summary Utility
 *
 * This file contains utilities for generating performance summaries
 * and comparing results across different benchmark scenarios.
 */

import type { Bench } from "tinybench";

/**
 * Generate performance summary for benchmark results
 */
export function generatePerformanceSummary(bench: Bench): void {
  const results = bench.results;
  const table = bench.table();

  if (results.length > 0 && table.length > 0) {
    // Create a mapping of results to task names using the table data
    const resultWithNames = results
      .filter((result): result is NonNullable<typeof result> => result != null)
      .map((result, index) => ({
        name: (table[index]?.["Task Name"] as string) || `Task ${index}`,
        opsPerSec: result.hz,
        result,
      }));

    // Find baseline (@codefast/tailwind-variants) for comparison
    const baselineEntry = resultWithNames.find((entry) =>
      entry.name.includes("@codefast/tailwind-variants"),
    );

    if (baselineEntry) {
      const baselineOpsPerSec = baselineEntry.opsPerSec;

      console.log(
        `\nBaseline: @codefast/tailwind-variants (${baselineOpsPerSec.toFixed(2)} ops/sec)`,
      );
      console.log("\nPerformance comparison vs baseline:");

      for (const entry of resultWithNames) {
        if (entry !== baselineEntry) {
          const relativePerformance = entry.opsPerSec / baselineOpsPerSec;
          const libraryName = entry.name.replace(/\[(simple|complex)\] /, "").trim();
          const performanceText =
            relativePerformance > 1
              ? `${relativePerformance.toFixed(2)}x faster`
              : `${(1 / relativePerformance).toFixed(2)}x slower`;

          console.log(
            `  ${libraryName}: ${performanceText} (${entry.opsPerSec.toFixed(2)} ops/sec)`,
          );
        }
      }
    }

    // Overall fastest and slowest
    const fastest = resultWithNames.reduce((previous, current) => {
      return previous.opsPerSec > current.opsPerSec ? previous : current;
    }, resultWithNames[0]);

    const slowest = resultWithNames.reduce((previous, current) => {
      return previous.opsPerSec < current.opsPerSec ? previous : current;
    }, resultWithNames[0]);

    console.log(`\nOverall performance range:`);
    console.log(`  Fastest: ${fastest.name} (${fastest.opsPerSec.toFixed(2)} ops/sec)`);
    console.log(`  Slowest: ${slowest.name} (${slowest.opsPerSec.toFixed(2)} ops/sec)`);
    console.log(`  Performance ratio: ${(fastest.opsPerSec / slowest.opsPerSec).toFixed(2)}x`);
  }
}
