/**
 * Benchmark utilities for performance measurement
 */

// eslint-disable-next-line import-x/no-extraneous-dependencies
import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { tv as tailwindVariants } from "tailwind-variants";

import { tv } from "../dist";

// Library name constants for consistent naming
export const LIBRARY_NAMES = {
  CVA: "class-variance-authority",
  CVA_MERGE: "CVA + tailwind-merge",
  TV: "@codefast/tailwind-variants",
  TV_NPM: "tailwind-variants (npm)",
} as const;

// Short names for object keys
export const LIBRARY_KEYS = {
  CVA: "cva",
  CVA_MERGE: "cvaMerge",
  TV: "tv",
  TV_NPM: "tvLib",
} as const;

export interface BenchmarkResult {
  avg: number;
  max: number;
  median: number;
  min: number;
  runs: number[];
}

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = (function_: () => void, iterations = 1000): number => {
  const startTime = performance.now();

  for (let index = 0; index < iterations; index++) {
    function_();
  }

  const endTime = performance.now();

  return endTime - startTime;
};

/**
 * Run benchmark with multiple iterations and return statistical data
 */
export const runBenchmark = (
  _name: string,
  function_: () => void,
  iterations = 1000,
  runs = 10,
): BenchmarkResult => {
  const results: number[] = [];

  for (let index = 0; index < runs; index++) {
    const time = measureExecutionTime(function_, iterations);

    results.push(time);
  }

  results.sort((a, b) => a - b);
  const avg = results.reduce((sum, time) => sum + time, 0) / results.length;
  const min = results[0];
  const max = results.at(-1) ?? 0;
  const median = results[Math.floor(results.length / 2)];

  return { avg, max, median, min, runs: results };
};

/**
 * Format speedup comparison for console output
 */
export const formatSpeedupComparison = (
  baselineName: string,
  comparisonName: string,
  baselineTime: number,
  comparisonTime: number,
): string => {
  const speedup = baselineTime / comparisonTime;

  return baselineTime < comparisonTime
    ? `✓ ${baselineName} is ${(comparisonTime / baselineTime).toFixed(1)}x faster than ${comparisonName}`
    : `✗ ${baselineName} is ${speedup.toFixed(1)}x slower than ${comparisonName}`;
};

/**
 * Find the fastest library from benchmark results
 */
export const findFastest = (
  results: Record<string, BenchmarkResult>,
): [string, BenchmarkResult] => {
  const fastest = Object.entries(results).reduce((a, b) => (a[1].avg < b[1].avg ? a : b));

  // Map short keys to full library names
  const keyToName: Record<string, string> = {
    [LIBRARY_KEYS.CVA]: LIBRARY_NAMES.CVA,
    [LIBRARY_KEYS.CVA_MERGE]: LIBRARY_NAMES.CVA_MERGE,
    [LIBRARY_KEYS.TV]: LIBRARY_NAMES.TV,
    [LIBRARY_KEYS.TV_NPM]: LIBRARY_NAMES.TV_NPM,
  };

  return [keyToName[fastest[0]] || fastest[0], fastest[1]];
};

/**
 * Memory usage measurement utilities
 */
export const measureMemoryUsage = (createInstances: () => void): number => {
  if (typeof globalThis.gc !== "function") {
    console.log("⚠ Garbage collection not available, skipping memory test");

    return 0;
  }

  globalThis.gc(); // Force garbage collection

  const initialMemory = process.memoryUsage().heapUsed;

  createInstances();

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  // Clean up
  globalThis.gc();

  return memoryIncrease;
};

/**
 * Format memory usage for console output
 */
export const formatMemoryUsage = (bytes: number): string => {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

/**
 * Format time with consistent width for table alignment
 */
export const formatTimeAligned = (ms: number): string => {
  if (ms < 1) {
    const micros = (ms * 1000).toFixed(1);

    return `${micros}μs`.padStart(8);
  }

  const formatted = `${ms.toFixed(2)}ms`;

  return formatted.padStart(8);
};

/**
 * Create a formatted table row for benchmark results
 */
export const createTableRow = (
  name: string,
  avg: number,
  min: number,
  max: number,
  isFastest = false,
): string => {
  const fastest = isFastest ? " 🏆" : "";
  const avgFormatted = formatTimeAligned(avg);
  const minFormatted = formatTimeAligned(min);
  const maxFormatted = formatTimeAligned(max);

  // Ensure consistent column alignment by using fixed width for library names
  const libraryName = name.padEnd(32);

  return `${libraryName} ${avgFormatted} ${minFormatted} ${maxFormatted}${fastest}`;
};

/**
 * Create table header for benchmark results
 */
export const createTableHeader = (): string => {
  const libraryCol = "Library".padEnd(32);
  const avgCol = "Avg".padStart(8);
  const minCol = "Min".padStart(8);
  const maxCol = "Max".padStart(8);
  const header = `${libraryCol} ${avgCol} ${minCol} ${maxCol}`;
  const separator = "─".repeat(60);

  return `${header}\n${separator}`;
};

/**
 * TV configuration type
 */
export interface TVConfig {
  readonly base: string;
  readonly compoundVariants?: {
    readonly className: string;
    readonly [key: string]: boolean | string;
  }[];
  readonly defaultVariants?: Record<string, boolean | string>;
  readonly slots?: Record<string, string>;
  readonly variants?: Record<string, Record<string, string>>;
}

/**
 * Test case type
 */
export type TestCase = Record<string, boolean | string>;

/**
 * Library instances type
 */
export interface LibraryInstances {
  readonly cva: (...args: never[]) => string;
  readonly tv: unknown;
  readonly tvLib: unknown;
}

/**
 * Create library instances for benchmarking
 */
export const createLibraryInstances = (config: unknown): LibraryInstances => {
  const { base, compoundVariants, defaultVariants, variants } = config as TVConfig;

  return {
    cva: cva(base, {
      compoundVariants: compoundVariants as never,
      defaultVariants: defaultVariants as Record<string, string>,
      variants,
    }),
    tv: tv(config as never),
    tvLib: tailwindVariants(config as never),
  };
};

/**
 * Benchmark results type
 */
export type BenchmarkResults = Record<string, BenchmarkResult>;

/**
 * Run benchmarks for all libraries
 */
export const runAllBenchmarks = (
  instances: LibraryInstances,
  testCases: readonly TestCase[],
  iterations = 1000,
): BenchmarkResults => {
  return {
    [LIBRARY_KEYS.CVA]: runBenchmark(
      LIBRARY_NAMES.CVA,
      () => {
        for (const props of testCases) instances.cva(props as never);
      },
      iterations,
    ),
    [LIBRARY_KEYS.CVA_MERGE]: runBenchmark(
      LIBRARY_NAMES.CVA_MERGE,
      () => {
        for (const props of testCases) {
          const classes = instances.cva(props as never);

          twMerge(classes);
        }
      },
      iterations,
    ),
    [LIBRARY_KEYS.TV]: runBenchmark(
      LIBRARY_NAMES.TV,
      () => {
        for (const props of testCases)
          (instances.tv as (...args: never[]) => string)(props as never);
      },
      iterations,
    ),
    [LIBRARY_KEYS.TV_NPM]: runBenchmark(
      LIBRARY_NAMES.TV_NPM,
      () => {
        for (const props of testCases)
          (instances.tvLib as (...args: never[]) => string)(props as never);
      },
      iterations,
    ),
  };
};

/**
 * Display benchmark results table
 */
export const displayBenchmarkTable = (results: BenchmarkResults): void => {
  console.log(createTableHeader());

  // Display TV results
  const tvResult = results[LIBRARY_KEYS.TV];

  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));

  // Display TV NPM results
  const tvNpmResult = results[LIBRARY_KEYS.TV_NPM];

  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvNpmResult.avg, tvNpmResult.min, tvNpmResult.max),
  );

  // Display CVA results
  const cvaResult = results[LIBRARY_KEYS.CVA];

  console.log(createTableRow(LIBRARY_NAMES.CVA, cvaResult.avg, cvaResult.min, cvaResult.max));

  // Display CVA Merge results
  const cvaMergeResult = results[LIBRARY_KEYS.CVA_MERGE];

  console.log(
    createTableRow(
      LIBRARY_NAMES.CVA_MERGE,
      cvaMergeResult.avg,
      cvaMergeResult.min,
      cvaMergeResult.max,
    ),
  );

  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);
};
