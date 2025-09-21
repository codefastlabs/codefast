/**
 * Performance Summary Utility
 *
 * This file contains utilities for generating performance summaries
 * and comparing results across different benchmark scenarios.
 */

import type { Bench, TaskResult } from "tinybench";

interface PerformanceAnalysis {
  averageOpsPerSec: number;
  fastest: null | TaskResult;
  performanceRanking: (TaskResult & { name: string; rank: number; relativePerformance: number })[];
  slowest: null | TaskResult;
  totalTests: number;
}

/**
 * Generate performance summary for benchmark results
 */
export function generatePerformanceSummary(bench: Bench): void {
  const results = bench.results;

  if (results.length === 0) {
    console.log("No benchmark results available for analysis");

    return;
  }

  const analysis = analyzePerformance(
    results.filter((r): r is TaskResult => r !== undefined),
    bench.tasks,
  );

  displayPerformanceSummary(analysis);
}

/**
 * Analyze benchmark results and extract key performance metrics
 */
function analyzePerformance(results: TaskResult[], tasks: { name: string }[]): PerformanceAnalysis {
  // Sort results by operations per second (descending - fastest first)
  const sortedResults = [...results].toSorted((a, b) => (b.hz || 0) - (a.hz || 0));

  const fastest = sortedResults[0] ?? null;
  const slowest = sortedResults.at(-1) ?? null;

  const totalOpsPerSec = results.reduce((sum, result) => sum + (result.hz || 0), 0);
  const averageOpsPerSec = totalOpsPerSec / results.length;

  const performanceRanking = sortedResults.map((result, index) => {
    const resultIndex = results.indexOf(result);
    const taskName = tasks[resultIndex]?.name ?? "Unknown";

    return {
      ...result,
      name: taskName,
      rank: index + 1,
      relativePerformance: fastest.hz ? (result.hz || 0) / fastest.hz : 0,
    };
  });

  return {
    averageOpsPerSec,
    fastest,
    performanceRanking,
    slowest,
    totalTests: results.length,
  };
}

/**
 * Display formatted performance summary
 */
function displayPerformanceSummary(analysis: PerformanceAnalysis): void {
  console.log("\n📊 Performance Analysis Summary");
  console.log("═══════════════════════════════════════");

  // Overall statistics
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   • Total tests: ${analysis.totalTests}`);
  console.log(`   • Average ops/sec: ${formatNumber(analysis.averageOpsPerSec)}`);

  // Fastest performer
  if (analysis.fastest) {
    const fastestRanking = analysis.performanceRanking.find((r) => r.rank === 1);

    console.log(`\n🏆 Fastest Performer:`);
    console.log(`   • ${(fastestRanking?.name ?? "Unknown") satisfies string}`);
    console.log(`   • ${formatNumber(analysis.fastest.hz || 0)} ops/sec`);
    console.log(`   • ${formatTime((analysis.fastest.period || 0) * 1_000_000_000)} avg time`);
  }

  // Performance ranking
  console.log(`\n🥇 Performance Ranking:`);

  for (const [index, result] of analysis.performanceRanking.entries()) {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
    const performance = result.relativePerformance;
    const performanceBar = generatePerformanceBar(performance);

    console.log(`   ${medal} ${result.name}`);
    console.log(
      `      ${formatNumber(result.hz || 0)} ops/sec (${(performance * 100).toFixed(1) satisfies string}% of fastest)`,
    );
    console.log(`      ${performanceBar}`);
  }
}

/**
 * Format large numbers with appropriate suffixes
 */
function formatNumber(number_: number): string {
  if (number_ >= 1_000_000) {
    return `${(number_ / 1_000_000).toFixed(1)}M`;
  } else if (number_ >= 1000) {
    return `${(number_ / 1000).toFixed(1)}K`;
  }

  return number_.toFixed(0);
}

/**
 * Format time in nanoseconds to readable format
 */
function formatTime(nanoseconds: number): string {
  if (nanoseconds >= 1_000_000) {
    return `${(nanoseconds / 1_000_000).toFixed(2)}ms`;
  } else if (nanoseconds >= 1000) {
    return `${(nanoseconds / 1000).toFixed(2)}μs`;
  }

  return `${nanoseconds.toFixed(2)}ns`;
}

/**
 * Generate a visual performance bar
 */
function generatePerformanceBar(performance: number): string {
  const barLength = 20;
  const filledLength = Math.round(performance * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

  return `[${bar}]`;
}
