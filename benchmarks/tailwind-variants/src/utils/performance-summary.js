/**
 * Performance Summary Utility
 *
 * This file contains utilities for generating performance summaries
 * and comparing results across different benchmark scenarios.
 */

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

/**
 * Generate performance summary for benchmark results
 */
export function generatePerformanceSummary(bench) {
  const results = bench.results;

  if (results.length === 0) {
    console.log(`${colors.red}❌ No benchmark results available for analysis${colors.reset}`);

    return;
  }

  const analysis = analyzePerformance(
    results.filter((r) => r !== undefined),
    bench.tasks,
  );

  displayPerformanceSummary(analysis);
}

/**
 * Analyze benchmark results and extract key performance metrics
 */
function analyzePerformance(results, tasks) {
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
function displayPerformanceSummary(analysis) {
  console.log(
    `\n${colors.cyan}${colors.bright}┌─────────────────────────────────────────────────────────────┐${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}│                 ${colors.yellow}🚀 PERFORMANCE ANALYSIS 🚀${colors.cyan}${colors.bright}                  │${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}└─────────────────────────────────────────────────────────────┘${colors.reset}`,
  );

  // Overall statistics with enhanced styling
  console.log(`\n${colors.magenta}${colors.bright}📊 Overall Statistics${colors.reset}`);
  console.log(
    `${colors.cyan}┌─────────────────────────────────────────────────────────────┐${colors.reset}`,
  );

  const totalTestsLine = `${colors.cyan}•${colors.reset} Total tests: ${colors.bright}${colors.white}${analysis.totalTests}${colors.reset}`;
  const avgOpsLine = `${colors.cyan}•${colors.reset} Average ops/sec: ${colors.bright}${colors.yellow}${formatNumber(analysis.averageOpsPerSec)}${colors.reset}`;

  const maxWidth = 59;
  const totalTestsPadding = Math.max(0, maxWidth - getVisibleLength(totalTestsLine));
  const avgOpsPadding = Math.max(0, maxWidth - getVisibleLength(avgOpsLine));

  console.log(
    `${colors.cyan}│${colors.reset} ${totalTestsLine}${" ".repeat(totalTestsPadding)} ${colors.cyan}│${colors.reset}`,
  );
  console.log(
    `${colors.cyan}│${colors.reset} ${avgOpsLine}${" ".repeat(avgOpsPadding)} ${colors.cyan}│${colors.reset}`,
  );
  console.log(
    `${colors.cyan}└─────────────────────────────────────────────────────────────┘${colors.reset}`,
  );

  // Fastest performer with special styling
  if (analysis.fastest) {
    const fastestRanking = analysis.performanceRanking.find((r) => r.rank === 1);

    console.log(`\n${colors.yellow}${colors.bright}🏆 Fastest Performer${colors.reset}`);
    console.log(
      `${colors.yellow}┌─────────────────────────────────────────────────────────────┐${colors.reset}`,
    );

    const nameLine = `${colors.yellow}•${colors.reset} ${colors.bright}${colors.yellow}${fastestRanking?.name ?? "Unknown"}${colors.reset}`;
    const opsLine = `${colors.yellow}•${colors.reset} ${colors.bright}${colors.green}${formatNumber(analysis.fastest.hz || 0)} ops/sec${colors.reset}`;
    const timeLine = `${colors.yellow}•${colors.reset} ${colors.bright}${colors.cyan}${formatTime((analysis.fastest.period || 0) * 1_000_000_000)} avg time${colors.reset}`;

    const namePadding = Math.max(0, maxWidth - getVisibleLength(nameLine));
    const opsPadding = Math.max(0, maxWidth - getVisibleLength(opsLine));
    const timePadding = Math.max(0, maxWidth - getVisibleLength(timeLine));

    console.log(
      `${colors.yellow}│${colors.reset} ${nameLine}${" ".repeat(namePadding)} ${colors.yellow}│${colors.reset}`,
    );
    console.log(
      `${colors.yellow}│${colors.reset} ${opsLine}${" ".repeat(opsPadding)} ${colors.yellow}│${colors.reset}`,
    );
    console.log(
      `${colors.yellow}│${colors.reset} ${timeLine}${" ".repeat(timePadding)} ${colors.yellow}│${colors.reset}`,
    );
    console.log(
      `${colors.yellow}└─────────────────────────────────────────────────────────────┘${colors.reset}`,
    );
  }

  // Performance ranking with enhanced visuals
  console.log(`\n${colors.blue}${colors.bright}🏁 Performance Ranking${colors.reset}`);
  console.log(
    `${colors.blue}┌─────────────────────────────────────────────────────────────┐${colors.reset}`,
  );

  for (const [index, result] of analysis.performanceRanking.entries()) {
    const medal = getMedalEmoji(index);
    const performance = result.relativePerformance;
    const performanceBar = generatePerformanceBar(performance);
    const performanceColor = getPerformanceColor(performance);

    // Calculate padding to align the right border
    const nameLine = `${medal} ${colors.bright}${index === 0 ? colors.yellow : colors.white}${result.name}${colors.reset}`;
    const statsLine = `    ${colors.dim}${formatNumber(result.hz || 0)} ops/sec${colors.reset} ${colors.dim}(${(performance * 100).toFixed(1)}% of fastest)${colors.reset}`;
    const barLine = `    ${performanceColor}${performanceBar}${colors.reset}`;

    const maxWidth = 59; // Total box width minus borders
    const namePadding = Math.max(0, maxWidth - getVisibleLength(nameLine));
    const statsPadding = Math.max(0, maxWidth - getVisibleLength(statsLine));
    const barPadding = Math.max(0, maxWidth - getVisibleLength(barLine));

    console.log(
      `${colors.blue}│${colors.reset} ${nameLine}${" ".repeat(namePadding)} ${colors.blue}│${colors.reset}`,
    );
    console.log(
      `${colors.blue}│${colors.reset} ${statsLine}${" ".repeat(statsPadding)} ${colors.blue}│${colors.reset}`,
    );
    console.log(
      `${colors.blue}│${colors.reset} ${barLine}${" ".repeat(barPadding)} ${colors.blue}│${colors.reset}`,
    );

    if (index < analysis.performanceRanking.length - 1) {
      console.log(
        `${colors.blue}│${colors.reset} ${" ".repeat(maxWidth)} ${colors.blue}│${colors.reset}`,
      );
    }
  }

  console.log(
    `${colors.blue}└─────────────────────────────────────────────────────────────┘${colors.reset}`,
  );
  console.log(
    `\n${colors.green}${colors.bright}✨ Analysis complete! Happy benchmarking! ✨${colors.reset}\n`,
  );
}

/**
 * Format large numbers with appropriate suffixes and visual enhancements
 */
function formatNumber(number_) {
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
function formatTime(nanoseconds) {
  if (nanoseconds >= 1_000_000) {
    return `${(nanoseconds / 1_000_000).toFixed(2)}ms`;
  } else if (nanoseconds >= 1000) {
    return `${(nanoseconds / 1000).toFixed(2)}μs`;
  }

  return `${nanoseconds.toFixed(2)}ns`;
}

/**
 * Get medal emoji based on ranking position
 */
function getMedalEmoji(index) {
  switch (index) {
    case 0:
      return `${colors.yellow}🥇${colors.reset}`;
    case 1:
      return `${colors.dim}🥈${colors.reset}`;
    case 2:
      return `${colors.red}🥉${colors.reset}`;
    default:
      return `${colors.dim}  ${index + 1}${colors.reset}`;
  }
}

/**
 * Get color based on performance percentage
 */
function getPerformanceColor(performance) {
  if (performance >= 0.9) return colors.green; // Excellent (90-100%)
  if (performance >= 0.7) return colors.yellow; // Good (70-89%)
  if (performance >= 0.5) return `${colors.bright}${colors.red}`; // Fair (50-69%)
  if (performance >= 0.25) return colors.red; // Poor (25-49%)
  return `${colors.red}${colors.bright}`; // Very Poor (0-24%)
}

/**
 * Get a visible length of text (excluding ANSI color codes)
 */
function getVisibleLength(text) {
  // Remove ANSI color codes to get actual visible length
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "").length;
}

/**
 * Generate a visual performance bar with enhanced styling
 */
function generatePerformanceBar(performance) {
  const barLength = 20;
  const filledLength = Math.round(performance * barLength);
  const emptyLength = barLength - filledLength;

  // Use different characters for better visual appeal
  const filledChar = "█";
  const emptyChar = "░";

  const bar = filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength);

  return `[${bar}]`;
}
