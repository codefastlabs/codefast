/**
 * Performance Summary Utility
 *
 * This file contains utilities for generating performance summaries
 * and comparing results across different benchmark scenarios.
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// Constants for consistent formatting
const BOX_WIDTH = 62;
// Inner content width accounts for one leading space and one trailing space
const INNER_WIDTH = BOX_WIDTH - 2;
const BOX_CHARS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
};
const PERFORMANCE_THRESHOLDS = {
  excellent: 0.9,
  good: 0.7,
  fair: 0.5,
  poor: 0.25,
};
const TIME_UNITS = {
  millisecond: 1_000_000,
  microsecond: 1_000,
};
const NUMBER_UNITS = {
  million: 1_000_000,
  thousand: 1_000,
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
  const sortedResults = [...results].toSorted((a, b) => (b.throughput.mean || 0) - (a.throughput.mean || 0));

  const fastest = sortedResults[0] ?? null;
  const slowest = sortedResults.at(-1) ?? null;

  const totalOpsPerSec = results.reduce((sum, result) => sum + (result.throughput.mean || 0), 0);
  const averageOpsPerSec = totalOpsPerSec / results.length;

  const performanceRanking = sortedResults.map((result, index) => {
    const resultIndex = results.indexOf(result);
    const taskName = tasks[resultIndex]?.name ?? 'Unknown';

    return {
      ...result,
      name: taskName,
      rank: index + 1,
      relativePerformance: fastest.throughput.mean ? (result.throughput.mean || 0) / fastest.throughput.mean : 0,
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
  displayFastestPerformer(analysis);
  displayPerformanceRanking(analysis);
}

/**
 * Create a horizontal line with a specified character
 */
function createHorizontalLine(char = BOX_CHARS.horizontal, width = BOX_WIDTH) {
  return char.repeat(width);
}

/**
 * Display a section with title and box border
 */
function displaySection(title, borderColor, contentLines = []) {
  console.log(`\n${borderColor}${colors.bright}${title}${colors.reset}`);
  console.log(`${borderColor}${BOX_CHARS.topLeft}${createHorizontalLine()}${BOX_CHARS.topRight}${colors.reset}`);

  contentLines.forEach((line) => {
    const visibleLineLength = getVisibleLength(line);
    const paddingNeeded = Math.max(0, INNER_WIDTH - visibleLineLength);
    const paddedLine = line + ' '.repeat(paddingNeeded);

    console.log(
      `${borderColor}${BOX_CHARS.vertical}${colors.reset} ${paddedLine}${colors.reset} ${borderColor}${BOX_CHARS.vertical}${colors.reset}`,
    );
  });

  console.log(`${borderColor}${BOX_CHARS.bottomLeft}${createHorizontalLine()}${BOX_CHARS.bottomRight}${colors.reset}`);
}

/**
 * Create a formatted line with a bullet point
 */
function createBulletLine(bulletColor, label, value, valueColor = colors.white) {
  return `${bulletColor}•${colors.reset} ${label} ${colors.bright}${valueColor}${value}${colors.reset}`;
}

/**
 * Display the fastest performer section
 */
function displayFastestPerformer(analysis) {
  if (!analysis.fastest) return;

  const fastestRanking = analysis.performanceRanking.find((r) => r.rank === 1);
  const name = fastestRanking?.name ?? 'Unknown';
  const opsPerSec = formatNumber(analysis.fastest.throughput.mean || 0);
  const avgTime = formatTime((analysis.fastest.period || 0) * 1_000_000_000);

  const nameLine = createBulletLine(colors.yellow, '', name, colors.yellow);
  const opsLine = createBulletLine(colors.yellow, '', `${opsPerSec} ops/sec`, colors.green);
  const timeLine = createBulletLine(colors.yellow, '', `${avgTime} avg time`, colors.cyan);

  displaySection('🏆 Fastest Performer', colors.yellow, [nameLine, opsLine, timeLine]);
}

/**
 * Display performance ranking section
 */
function displayPerformanceRanking(analysis) {
  console.log(`\n${colors.blue}${colors.bright}🏁 Performance Ranking${colors.reset}`);
  console.log(`${colors.blue}${BOX_CHARS.topLeft}${createHorizontalLine()}${BOX_CHARS.topRight}${colors.reset}`);

  for (const [index, result] of analysis.performanceRanking.entries()) {
    displayRankingEntry(result, index, analysis.performanceRanking.length);
  }

  console.log(`${colors.blue}${BOX_CHARS.bottomLeft}${createHorizontalLine()}${BOX_CHARS.bottomRight}${colors.reset}`);
}

/**
 * Display a single ranking entry
 */
function displayRankingEntry(result, index, totalLength) {
  const medal = getMedalEmoji(index);
  const performance = result.relativePerformance;
  const performanceBar = generatePerformanceBar(performance);
  const performanceColor = getPerformanceColor(performance);

  const nameLine = `${medal} ${colors.bright}${index === 0 ? colors.yellow : colors.white}${result.name}${colors.reset}`;
  const statsLine = `    ${colors.dim}${formatNumber(result.throughput.mean || 0)} ops/sec${colors.reset} ${colors.dim}(${(performance * 100).toFixed(1)}% of fastest)${colors.reset}`;
  const barLine = `    ${performanceColor}${performanceBar}${colors.reset}`;

  // Pad each line to ensure proper alignment with INNER_WIDTH
  const nameLineVisibleLength = getVisibleLength(nameLine);
  const statsLineVisibleLength = getVisibleLength(statsLine);
  const barLineVisibleLength = getVisibleLength(barLine);

  const paddedNameLine = nameLine + ' '.repeat(Math.max(0, INNER_WIDTH - nameLineVisibleLength));
  const paddedStatsLine = statsLine + ' '.repeat(Math.max(0, INNER_WIDTH - statsLineVisibleLength));
  const paddedBarLine = barLine + ' '.repeat(Math.max(0, INNER_WIDTH - barLineVisibleLength));

  console.log(
    `${colors.blue}${BOX_CHARS.vertical}${colors.reset} ${paddedNameLine}${colors.reset} ${colors.blue}${BOX_CHARS.vertical}${colors.reset}`,
  );
  console.log(
    `${colors.blue}${BOX_CHARS.vertical}${colors.reset} ${paddedStatsLine}${colors.reset} ${colors.blue}${BOX_CHARS.vertical}${colors.reset}`,
  );
  console.log(
    `${colors.blue}${BOX_CHARS.vertical}${colors.reset} ${paddedBarLine}${colors.reset} ${colors.blue}${BOX_CHARS.vertical}${colors.reset}`,
  );

  if (index < totalLength - 1) {
    console.log(
      `${colors.blue}${BOX_CHARS.vertical}${colors.reset} ${' '.repeat(INNER_WIDTH)} ${colors.blue}${BOX_CHARS.vertical}${colors.reset}`,
    );
  }
}

/**
 * Format large numbers with appropriate suffixes and visual enhancements
 */
function formatNumber(number) {
  if (number >= NUMBER_UNITS.million) {
    return `${(number / NUMBER_UNITS.million).toFixed(1)}M`;
  } else if (number >= NUMBER_UNITS.thousand) {
    return `${(number / NUMBER_UNITS.thousand).toFixed(1)}K`;
  }

  return number.toFixed(0);
}

/**
 * Format time in nanoseconds to readable format
 */
function formatTime(nanoseconds) {
  if (nanoseconds >= TIME_UNITS.millisecond) {
    return `${(nanoseconds / TIME_UNITS.millisecond).toFixed(2)}ms`;
  } else if (nanoseconds >= TIME_UNITS.microsecond) {
    return `${(nanoseconds / TIME_UNITS.microsecond).toFixed(2)}μs`;
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
  if (performance >= PERFORMANCE_THRESHOLDS.excellent) return colors.green; // Excellent (90-100%)
  if (performance >= PERFORMANCE_THRESHOLDS.good) return colors.yellow; // Good (70-89%)
  if (performance >= PERFORMANCE_THRESHOLDS.fair) return `${colors.bright}${colors.red}`; // Fair (50-69%)
  if (performance >= PERFORMANCE_THRESHOLDS.poor) return colors.red; // Poor (25-49%)
  return `${colors.red}${colors.bright}`; // Very Poor (0-24%)
}

/**
 * Get a visible length of text (excluding ANSI color codes)
 */
function getVisibleLength(text) {
  // Remove ANSI color codes to get actual visible length
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/**
 * Generate a visual performance bar with enhanced styling
 */
function generatePerformanceBar(performance) {
  const barLength = 50;
  const filledLength = Math.round(performance * barLength);
  const emptyLength = barLength - filledLength;

  // Use different characters for better visual appeal
  const filledChar = '█';
  const emptyChar = '░';

  const bar = filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength);

  return `[${bar}]`;
}
