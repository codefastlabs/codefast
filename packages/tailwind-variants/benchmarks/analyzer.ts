/**
 * Benchmark result analyzer and reporter
 */

import type { BenchmarkResult } from "./utils";

import { tv } from "../dist";
import {
  findFastest,
  formatMemoryUsage,
  formatSpeedupComparison,
  LIBRARY_KEYS,
  LIBRARY_NAMES,
  measureMemoryUsage,
} from "./utils";

export interface BenchmarkResults {
  advancedCard: Record<string, BenchmarkResult>;
  basic: Record<string, BenchmarkResult>;
  complexButton: Record<string, BenchmarkResult>;
  compound: Record<string, BenchmarkResult>;
  dataTable: Record<string, BenchmarkResult>;
  formComponents: Record<string, BenchmarkResult>;
  large: Record<string, BenchmarkResult>;
  realWorldComponents: Record<string, BenchmarkResult>;
  responsiveLayout: Record<string, BenchmarkResult>;
  slots: Record<string, BenchmarkResult>;
}

/**
 * Format time with consistent width for table alignment
 */
const formatTimeForTable = (ms: number): string => {
  if (ms < 1) {
    const micros = (ms * 1000).toFixed(1);

    return `${micros}μs`.padStart(8);
  }

  return `${ms.toFixed(2)}ms`.padStart(8);
};

/**
 * Add summary statistics after the comprehensive table
 */
const addSummaryStatistics = (results: BenchmarkResults): void => {
  console.log("\n📈 Summary Statistics");
  console.log("═".repeat(60));

  // Count wins for each library
  const benchmarks = [
    { key: "basic", name: "Basic Variants" },
    { key: "compound", name: "Compound Variants" },
    { key: "large", name: "Large Dataset" },
    { key: "complexButton", name: "Complex Button" },
    { key: "slots", name: "Slots" },
    { key: "advancedCard", name: "Advanced Card" },
    { key: "responsiveLayout", name: "Responsive Layout" },
    { key: "formComponents", name: "Form Components" },
    { key: "dataTable", name: "Data Table" },
    { key: "realWorldComponents", name: "Real-world Components" },
  ];

  const wins = {
    [LIBRARY_KEYS.CVA]: 0,
    [LIBRARY_KEYS.CVA_MERGE]: 0,
    [LIBRARY_KEYS.TV]: 0,
    [LIBRARY_KEYS.TV_NPM]: 0,
  };

  for (const { key } of benchmarks) {
    const fastest = findFastest(results[key as keyof BenchmarkResults]);
    const fastestKey = Object.keys(results[key as keyof BenchmarkResults]).find(
      (k) => results[key as keyof BenchmarkResults][k].avg === fastest[1].avg,
    );

    if (fastestKey) {
      wins[fastestKey as keyof typeof wins]++;
    }
  }

  console.log("🏆 Wins by Library:");
  console.log(`${LIBRARY_NAMES.TV}: ${wins[LIBRARY_KEYS.TV]} wins`);
  console.log(`${LIBRARY_NAMES.TV_NPM}: ${wins[LIBRARY_KEYS.TV_NPM]} wins`);
  console.log(`${LIBRARY_NAMES.CVA}: ${wins[LIBRARY_KEYS.CVA]} wins`);
  console.log(`${LIBRARY_NAMES.CVA_MERGE}: ${wins[LIBRARY_KEYS.CVA_MERGE]} wins`);

  // Calculate average performance for comparable benchmarks
  const comparableBenchmarks = ["basic", "compound", "large", "complexButton"];
  const avgPerformance = {
    [LIBRARY_KEYS.CVA]: 0,
    [LIBRARY_KEYS.CVA_MERGE]: 0,
    [LIBRARY_KEYS.TV]: 0,
    [LIBRARY_KEYS.TV_NPM]: 0,
  };

  for (const key of comparableBenchmarks) {
    const benchmarkResults = results[key as keyof BenchmarkResults];

    avgPerformance[LIBRARY_KEYS.TV] += benchmarkResults[LIBRARY_KEYS.TV].avg;
    avgPerformance[LIBRARY_KEYS.TV_NPM] += benchmarkResults[LIBRARY_KEYS.TV_NPM].avg;
    avgPerformance[LIBRARY_KEYS.CVA] += benchmarkResults[LIBRARY_KEYS.CVA].avg;
    avgPerformance[LIBRARY_KEYS.CVA_MERGE] += benchmarkResults[LIBRARY_KEYS.CVA_MERGE].avg;
  }

  const benchmarkCount = comparableBenchmarks.length;

  for (const key of Object.keys(avgPerformance)) {
    avgPerformance[key as keyof typeof avgPerformance] /= benchmarkCount;
  }

  console.log("\n⚡ Average Performance (Comparable Benchmarks):");
  console.log(`${LIBRARY_NAMES.TV}: ${avgPerformance[LIBRARY_KEYS.TV].toFixed(2)}ms`);
  console.log(`${LIBRARY_NAMES.TV_NPM}: ${avgPerformance[LIBRARY_KEYS.TV_NPM].toFixed(2)}ms`);
  console.log(`${LIBRARY_NAMES.CVA}: ${avgPerformance[LIBRARY_KEYS.CVA].toFixed(2)}ms`);
  console.log(`${LIBRARY_NAMES.CVA_MERGE}: ${avgPerformance[LIBRARY_KEYS.CVA_MERGE].toFixed(2)}ms`);
};

/**
 * Create a comprehensive benchmark results table
 */
const createComprehensiveTable = (results: BenchmarkResults): void => {
  console.log("\n📊 Comprehensive Benchmark Results Table");
  console.log("═".repeat(133));

  // Define all benchmarks with their metadata
  const benchmarks = [
    { hasAllLibraries: true, key: "basic", name: "Basic Variants" },
    { hasAllLibraries: true, key: "compound", name: "Compound Variants" },
    { hasAllLibraries: true, key: "large", name: "Large Dataset" },
    { hasAllLibraries: true, key: "complexButton", name: "Complex Button" },
    { hasAllLibraries: false, key: "slots", name: "Slots" },
    { hasAllLibraries: false, key: "advancedCard", name: "Advanced Card" },
    { hasAllLibraries: false, key: "responsiveLayout", name: "Responsive Layout" },
    { hasAllLibraries: false, key: "formComponents", name: "Form Components" },
    { hasAllLibraries: false, key: "dataTable", name: "Data Table" },
    { hasAllLibraries: false, key: "realWorldComponents", name: "Real-world Components" },
  ];

  // Create a table header with proper spacing
  const header =
    "Benchmark".padEnd(22) +
    LIBRARY_NAMES.TV.padEnd(30) +
    LIBRARY_NAMES.TV_NPM.padEnd(30) +
    LIBRARY_NAMES.CVA.padEnd(30) +
    LIBRARY_NAMES.CVA_MERGE.padEnd(30);

  console.log(header);
  console.log("─".repeat(133));

  // Create table rows
  for (const { key, name } of benchmarks) {
    const benchmarkResults = results[key as keyof BenchmarkResults];

    // Find fastest for this benchmark
    const fastest = findFastest(benchmarkResults);
    const fastestKey = Object.keys(benchmarkResults).find(
      (k) => benchmarkResults[k].avg === fastest[1].avg,
    );

    // Format each library result
    const tvResult = benchmarkResults[LIBRARY_KEYS.TV];
    const tvNpmResult = benchmarkResults[LIBRARY_KEYS.TV_NPM];
    const cvaResult = benchmarkResults[LIBRARY_KEYS.CVA];
    const cvaMergeResult = benchmarkResults[LIBRARY_KEYS.CVA_MERGE];

    const tvTime = formatTimeForTable(tvResult.avg) + (LIBRARY_KEYS.TV === fastestKey ? " *" : "");
    const tvNpmTime =
      formatTimeForTable(tvNpmResult.avg) + (LIBRARY_KEYS.TV_NPM === fastestKey ? " *" : "");
    const cvaTime =
      LIBRARY_KEYS.CVA in benchmarkResults
        ? formatTimeForTable(cvaResult.avg) + (LIBRARY_KEYS.CVA === fastestKey ? " *" : "")
        : "N/A".padStart(8);
    const cvaMergeTime =
      LIBRARY_KEYS.CVA_MERGE in benchmarkResults
        ? formatTimeForTable(cvaMergeResult.avg) +
          (LIBRARY_KEYS.CVA_MERGE === fastestKey ? " *" : "")
        : "N/A".padStart(8);

    const row =
      name.padEnd(22) +
      tvTime.padEnd(30) +
      tvNpmTime.padEnd(30) +
      cvaTime.padEnd(30) +
      cvaMergeTime.padEnd(30);

    console.log(row);
  }

  console.log("─".repeat(133));
  console.log("* = Fastest in that benchmark");
  console.log(
    "\n💡 Note: CVA (class-variance-authority) doesn't support slots or advanced features,",
  );
  console.log("   so it's only included in basic variant benchmarks for fair comparison.");
};

/**
 * Analyze and display benchmark results
 */
export const analyzeResults = (results: BenchmarkResults): void => {
  console.log("\n📈 Performance Summary");
  console.log("═".repeat(60));

  // Create a comprehensive table
  createComprehensiveTable(results);

  // Add summary statistics
  addSummaryStatistics(results);

  // TV performance relative to competitors
  console.log(`\n🔍 ${LIBRARY_NAMES.TV} Performance Analysis`);
  console.log("═".repeat(60));

  // Calculate average performance across all comparable benchmarks
  const comparableBenchmarks = ["basic", "compound", "large", "complexButton"];
  const tvAvgTime =
    comparableBenchmarks.reduce(
      (sum, key) => sum + results[key as keyof BenchmarkResults][LIBRARY_KEYS.TV].avg,
      0,
    ) / comparableBenchmarks.length;
  const tvNpmAvgTime =
    comparableBenchmarks.reduce(
      (sum, key) => sum + results[key as keyof BenchmarkResults][LIBRARY_KEYS.TV_NPM].avg,
      0,
    ) / comparableBenchmarks.length;
  const cvaAvgTime =
    comparableBenchmarks.reduce(
      (sum, key) => sum + results[key as keyof BenchmarkResults][LIBRARY_KEYS.CVA].avg,
      0,
    ) / comparableBenchmarks.length;
  const cvaMergeAvgTime =
    comparableBenchmarks.reduce(
      (sum, key) => sum + results[key as keyof BenchmarkResults][LIBRARY_KEYS.CVA_MERGE].avg,
      0,
    ) / comparableBenchmarks.length;

  console.log("📊 Performance Comparison (Average across comparable benchmarks):");
  console.log();

  // Format comparison results with clear messaging
  console.log(
    formatSpeedupComparison(LIBRARY_NAMES.TV, LIBRARY_NAMES.TV_NPM, tvAvgTime, tvNpmAvgTime),
  );

  console.log(formatSpeedupComparison(LIBRARY_NAMES.TV, LIBRARY_NAMES.CVA, tvAvgTime, cvaAvgTime));

  console.log(
    formatSpeedupComparison(LIBRARY_NAMES.TV, LIBRARY_NAMES.CVA_MERGE, tvAvgTime, cvaMergeAvgTime),
  );

  // Memory usage analysis
  console.log("\n💾 Memory Usage Analysis");
  console.log("═".repeat(60));

  const memoryIncrease = measureMemoryUsage(() => {
    // Create many instances
    const instances = Array.from({ length: 1000 }, () => {
      return tv({
        base: "base-class",
        variants: {
          color: {
            primary: "text-blue-500",
            secondary: "text-gray-500",
          },
        },
      });
    });

    // Clean up
    instances.length = 0;
  });

  if (memoryIncrease > 0) {
    console.log(`Memory increase for 1000 TV instances: ${formatMemoryUsage(memoryIncrease)}`);
  }
};
