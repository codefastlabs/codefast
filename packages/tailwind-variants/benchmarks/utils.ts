/**
 * Benchmark utilities for performance measurement
 */

// Library name constants for consistent naming
export const LIBRARY_NAMES = {
  CVA: "class-variance-authority",
  TV: "@codefast/tailwind-variants",
  TV_NPM: "tailwind-variants (npm)",
} as const;

// Short names for object keys
export const LIBRARY_KEYS = {
  CVA: "cva",
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
