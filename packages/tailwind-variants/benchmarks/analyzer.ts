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
 * Analyze and display benchmark results
 */
export const analyzeResults = (results: BenchmarkResults): void => {
  console.log("\nPerformance Summary");
  console.log("=".repeat(50));

  // Find the fastest library for each benchmark
  const fastest = {
    advancedCard: findFastest(results.advancedCard),
    basic: findFastest(results.basic),
    complexButton: findFastest(results.complexButton),
    compound: findFastest(results.compound),
    dataTable: findFastest(results.dataTable),
    formComponents: findFastest(results.formComponents),
    large: findFastest(results.large),
    realWorldComponents: findFastest(results.realWorldComponents),
    responsiveLayout: findFastest(results.responsiveLayout),
    slots: findFastest(results.slots),
  };

  console.log(
    `Fastest Basic Variants:        ${fastest.basic[0]} (${fastest.basic[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Compound Variants:     ${fastest.compound[0]} (${fastest.compound[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Slots:                 ${fastest.slots[0]} (${fastest.slots[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Large Dataset:         ${fastest.large[0]} (${fastest.large[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Complex Button:        ${fastest.complexButton[0]} (${fastest.complexButton[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Advanced Card:         ${fastest.advancedCard[0]} (${fastest.advancedCard[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Responsive Layout:     ${fastest.responsiveLayout[0]} (${fastest.responsiveLayout[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Form Components:       ${fastest.formComponents[0]} (${fastest.formComponents[1].avg.toFixed(2)}ms)`,
  );
  console.log(
    `Fastest Data Table:            ${fastest.dataTable[0]} (${fastest.dataTable[1].avg.toFixed(2)}ms)`,
  );

  console.log(
    `Fastest Real-world Components: ${fastest.realWorldComponents[0]} (${fastest.realWorldComponents[1].avg.toFixed(2)}ms)`,
  );

  // TV performance relative to competitors
  console.log(`\n${LIBRARY_NAMES.TV} Performance Analysis`);
  console.log("=".repeat(50));

  // Format comparison results with clear messaging
  console.log(
    formatSpeedupComparison(
      LIBRARY_NAMES.TV,
      LIBRARY_NAMES.TV_NPM,
      results.basic[LIBRARY_KEYS.TV].avg,
      results.basic[LIBRARY_KEYS.TV_NPM].avg,
    ),
  );

  console.log(
    formatSpeedupComparison(
      LIBRARY_NAMES.TV,
      LIBRARY_NAMES.CVA,
      results.basic[LIBRARY_KEYS.TV].avg,
      results.basic[LIBRARY_KEYS.CVA].avg,
    ),
  );

  // Advanced performance analysis
  console.log("\nAdvanced Performance Analysis");
  console.log("=".repeat(50));

  // Compare complex scenarios
  console.log(
    `Complex Button: ${formatSpeedupComparison(
      LIBRARY_NAMES.TV,
      LIBRARY_NAMES.TV_NPM,
      results.complexButton[LIBRARY_KEYS.TV].avg,
      results.complexButton[LIBRARY_KEYS.TV_NPM].avg,
    )}`,
  );

  console.log(
    `Real-world Components: ${formatSpeedupComparison(
      LIBRARY_NAMES.TV,
      LIBRARY_NAMES.TV_NPM,
      results.realWorldComponents[LIBRARY_KEYS.TV].avg,
      results.realWorldComponents[LIBRARY_KEYS.TV_NPM].avg,
    )}`,
  );

  // Memory usage analysis
  console.log("\nMemory Usage Analysis");
  console.log("=".repeat(50));

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
