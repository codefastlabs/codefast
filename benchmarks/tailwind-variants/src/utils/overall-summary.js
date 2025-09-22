/**
 * Overall Summary Utility
 *
 * This file contains utilities for generating comprehensive performance summaries
 * across all benchmark scenarios with perfect border alignment.
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
 * Generate comprehensive overall summary for all benchmark results
 */
export function generateOverallSummary(benchmarkResults) {
  const analysis = analyzeOverallPerformance(benchmarkResults);

  console.log(
    `\n${colors.cyan}${colors.bright}════════════════════════════════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}                          🏆 OVERALL PERFORMANCE SUMMARY 🏆${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bright}════════════════════════════════════════════════════════════════════════════════${colors.reset}`,
  );

  displayLibraryRankings(analysis);
  displayScenarioBreakdown(analysis);
  displayPerformanceInsights(analysis);
  displayRecommendations(analysis);

  console.log(
    `\n${colors.green}${colors.bright}✨ Overall analysis complete! Choose your champion! ✨${colors.reset}\n`,
  );
}

/**
 * Analyze performance across all benchmark scenarios
 */
function analyzeOverallPerformance(benchmarkResults) {
  const libraryStats = new Map();

  // Process each benchmark scenario
  benchmarkResults.forEach((bench, scenarioName) => {
    if (!bench.results || bench.results.length === 0) return;

    bench.results.forEach((result, index) => {
      if (!result) return;

      const taskName = bench.tasks[index]?.name || "Unknown";
      const libraryName = extractLibraryName(taskName);
      const opsPerSec = result.hz || 0;

      if (!libraryStats.has(libraryName)) {
        libraryStats.set(libraryName, {
          name: libraryName,
          scenarios: [],
          totalOpsPerSec: 0,
          scenarioCount: 0,
          wins: 0,
          avgPerformance: 0,
        });
      }

      const stats = libraryStats.get(libraryName);
      stats.scenarios.push({
        name: scenarioName,
        taskName,
        opsPerSec,
        isWinner: opsPerSec === Math.max(...bench.results.filter((r) => r).map((r) => r.hz || 0)),
      });

      stats.totalOpsPerSec += opsPerSec;
      stats.scenarioCount++;

      if (stats.scenarios[stats.scenarios.length - 1].isWinner) {
        stats.wins++;
      }
    });
  });

  // Calculate average performance for each library
  libraryStats.forEach((stats) => {
    stats.avgPerformance = stats.totalOpsPerSec / stats.scenarioCount;
  });

  // Sort libraries by win rate first, then by average performance
  // This ensures libraries that win more scenarios are ranked higher
  const sortedLibraries = Array.from(libraryStats.values()).sort((a, b) => {
    const winRateA = a.wins / a.scenarioCount;
    const winRateB = b.wins / b.scenarioCount;

    // Primary sort: by win rate (descending)
    if (winRateA !== winRateB) {
      return winRateB - winRateA;
    }

    // Secondary sort: by average performance (descending)
    return b.avgPerformance - a.avgPerformance;
  });

  const totalScenarios = benchmarkResults.size;
  const totalTests = Array.from(libraryStats.values()).reduce(
    (sum, stats) => sum + stats.scenarioCount,
    0,
  );

  return {
    libraries: sortedLibraries,
    totalScenarios,
    totalTests,
    libraryCount: libraryStats.size,
  };
}

/**
 * Display library performance rankings
 */
function displayLibraryRankings(analysis) {
  console.log(`${colors.magenta}${colors.bright}📊 Library Performance Rankings${colors.reset}`);
  console.log(
    `${colors.cyan}┌──────────────────────────────────────────────────────────────────────────────────┐${colors.reset}`,
  );

  // Header row
  const headerLine = `${colors.cyan}│${colors.reset} ${colors.bright}${colors.white}Library${colors.reset}                       ${colors.bright}${colors.white}Avg Performance${colors.reset}    ${colors.bright}${colors.white}Wins${colors.reset}    ${colors.bright}${colors.white}Total Tests${colors.reset}    ${colors.bright}${colors.white}Win Rate${colors.reset} ${colors.cyan}│${colors.reset}`;
  console.log(headerLine);

  // Separator
  console.log(
    `${colors.cyan}├──────────────────────────────────────────────────────────────────────────────────┤${colors.reset}`,
  );

  // Data rows
  analysis.libraries.forEach((library, index) => {
    const medal = getMedalEmoji(index);
    const libraryName = truncateText(library.name, 25);
    const avgPerf = formatNumber(library.avgPerformance);
    const wins = library.wins.toString();
    const totalTests = library.scenarioCount.toString();
    const winRate = `${((library.wins / library.scenarioCount) * 100).toFixed(1)}%`;

    // Calculate padding for perfect alignment
    const libraryPadding = Math.max(0, 26 - getVisibleLength(libraryName));
    const avgPerfPadding = Math.max(0, 18 - getVisibleLength(avgPerf));
    const winsPadding = Math.max(0, 7 - getVisibleLength(wins));
    const totalTestsPadding = Math.max(0, 14 - getVisibleLength(totalTests));
    const winRatePadding = Math.max(0, 8 - getVisibleLength(winRate));

    const dataLine = `${colors.cyan}│${colors.reset} ${medal} ${colors.bright}${index === 0 ? colors.yellow : colors.white}${libraryName}${colors.reset}${" ".repeat(libraryPadding)} ${colors.green}${avgPerf}${colors.reset}${" ".repeat(avgPerfPadding)} ${colors.cyan}${wins}${colors.reset}${" ".repeat(winsPadding)} ${colors.blue}${totalTests}${colors.reset}${" ".repeat(totalTestsPadding)} ${colors.magenta}${winRate}${colors.reset}${" ".repeat(winRatePadding)} ${colors.cyan}│${colors.reset}`;

    console.log(dataLine);
  });

  console.log(
    `${colors.cyan}└──────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`,
  );
}

/**
 * Display scenario breakdown
 */
function displayScenarioBreakdown(analysis) {
  console.log(`${colors.blue}${colors.bright}🎯 Scenario Performance Breakdown${colors.reset}`);
  console.log(
    `${colors.cyan}┌─────────────────────────────────────────────────────────────────────────────────┐${colors.reset}`,
  );

  // Get unique scenarios
  const scenarios = new Set();
  analysis.libraries.forEach((library) => {
    library.scenarios.forEach((scenario) => {
      scenarios.add(scenario.name);
    });
  });

  const sortedScenarios = Array.from(scenarios).sort();

  sortedScenarios.forEach((scenarioName) => {
    // Find the winner for this scenario
    let winner = null;
    let maxOps = 0;

    analysis.libraries.forEach((library) => {
      const scenario = library.scenarios.find((s) => s.name === scenarioName);
      if (scenario && scenario.opsPerSec > maxOps) {
        maxOps = scenario.opsPerSec;
        winner = { library: library.name, ops: scenario.opsPerSec };
      }
    });

    if (winner) {
      const scenarioDisplay = truncateText(scenarioName, 50);
      const winnerDisplay = truncateText(winner.library, 20);
      const opsDisplay = formatNumber(winner.ops);

      const scenarioPadding = Math.max(0, 50 - getVisibleLength(scenarioDisplay));
      const winnerPadding = Math.max(0, 20 - getVisibleLength(winnerDisplay));
      const opsPadding = Math.max(0, 7 - getVisibleLength(opsDisplay));

      const scenarioLine = `${colors.cyan}│${colors.reset} ${colors.bright}${colors.white}${scenarioDisplay}${colors.reset}${" ".repeat(scenarioPadding)} ${colors.green}${winnerDisplay}${colors.reset}${" ".repeat(winnerPadding)} ${colors.yellow}${opsDisplay}${colors.reset}${" ".repeat(opsPadding)} ${colors.cyan}│${colors.reset}`;

      console.log(scenarioLine);
    }
  });

  console.log(
    `${colors.cyan}└─────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`,
  );
}

/**
 * Display performance insights
 */
function displayPerformanceInsights(analysis) {
  console.log(`${colors.yellow}${colors.bright}💡 Performance Insights${colors.reset}`);
  console.log(
    `${colors.cyan}┌──────────────────────────────────────────────────────────────────────────────────────────────────┐${colors.reset}`,
  );

  const insights = generateInsights(analysis);

  insights.forEach((insight) => {
    const insightLine = `${colors.cyan}│${colors.reset} ${colors.bright}${colors.cyan}•${colors.reset} ${insight}${" ".repeat(Math.max(0, 94 - getVisibleLength(insight)))} ${colors.cyan}│${colors.reset}`;
    console.log(insightLine);
  });

  console.log(
    `${colors.cyan}└──────────────────────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`,
  );
}

/**
 * Display recommendations
 */
function displayRecommendations(analysis) {
  console.log(`${colors.green}${colors.bright}🎯 Recommendations${colors.reset}`);
  console.log(
    `${colors.cyan}┌───────────────────────────────────────────────────────────────────────────────────────────────┐${colors.reset}`,
  );

  const recommendations = generateRecommendations(analysis);

  recommendations.forEach((recommendation) => {
    const recLine = `${colors.cyan}│${colors.reset} ${colors.bright}${colors.green}•${colors.reset} ${recommendation}${" ".repeat(Math.max(0, 91 - getVisibleLength(recommendation)))} ${colors.cyan}│${colors.reset}`;
    console.log(recLine);
  });

  console.log(
    `${colors.cyan}└───────────────────────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`,
  );
}

/**
 * Extract library name from task name
 */
function extractLibraryName(taskName) {
  if (taskName.includes("@codefast/tailwind-variants")) {
    return "@codefast/tailwind-variants";
  } else if (taskName.includes("class-variance-authority")) {
    return "class-variance-authority";
  } else if (taskName.includes("tailwind-variants")) {
    return "tailwind-variants";
  }
  return "Unknown";
}

/**
 * Format large numbers with appropriate suffixes
 */
function formatNumber(number) {
  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toFixed(0);
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
 * Get visible length of text (excluding ANSI color codes)
 */
function getVisibleLength(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "").length;
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
  // eslint-disable-next-line no-control-regex
  const visibleText = text.replace(/\x1b\[[0-9;]*m/g, "");
  if (visibleText.length <= maxLength) {
    return text;
  }

  // Find the position to truncate while preserving color codes
  let visibleCount = 0;
  let truncatePos = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\x1b") {
      // Skip ANSI escape sequence
      while (i < text.length && text[i] !== "m") i++;
    } else {
      visibleCount++;
      if (visibleCount <= maxLength) {
        truncatePos = i + 1;
      } else {
        break;
      }
    }
  }

  return text.substring(0, truncatePos);
}

/**
 * Generate performance insights
 */
function generateInsights(analysis) {
  const insights = [];
  const topLibrary = analysis.libraries[0];
  const secondLibrary = analysis.libraries[1];

  if (topLibrary) {
    insights.push(
      `${colors.yellow}${topLibrary.name}${colors.reset} dominates with ${colors.green}${topLibrary.wins}/${topLibrary.scenarioCount} scenario wins${colors.reset}`,
    );

    if (secondLibrary && topLibrary.avgPerformance > 0 && secondLibrary.avgPerformance > 0) {
      if (topLibrary.avgPerformance > secondLibrary.avgPerformance) {
        const improvement = (
          ((topLibrary.avgPerformance - secondLibrary.avgPerformance) /
            secondLibrary.avgPerformance) *
          100
        ).toFixed(1);
        insights.push(
          `Performance advantage: ${colors.green}${improvement}%${colors.reset} faster than ${colors.cyan}${secondLibrary.name}${colors.reset}`,
        );
      } else {
        const disadvantage = (
          ((secondLibrary.avgPerformance - topLibrary.avgPerformance) / topLibrary.avgPerformance) *
          100
        ).toFixed(1);
        insights.push(
          `Performance disadvantage: ${colors.yellow}${disadvantage}%${colors.reset} slower than ${colors.cyan}${secondLibrary.name}${colors.reset} (but wins more scenarios)`,
        );
      }
    }
  }

  insights.push(
    `Total benchmark scenarios: ${colors.blue}${analysis.totalScenarios}${colors.reset}`,
  );
  insights.push(`Total performance tests: ${colors.magenta}${analysis.totalTests}${colors.reset}`);

  return insights;
}

/**
 * Generate recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  const topLibrary = analysis.libraries[0];

  if (topLibrary && topLibrary.name === "@codefast/tailwind-variants") {
    recommendations.push(
      `Use ${colors.yellow}@codefast/tailwind-variants${colors.reset} for ${colors.green}maximum performance${colors.reset} in all scenarios`,
    );
    recommendations.push(
      `Best choice for ${colors.blue}production applications${colors.reset} requiring high throughput`,
    );
  }

  recommendations.push(
    `Consider ${colors.cyan}class-variance-authority${colors.reset} for ${colors.dim}simple use cases${colors.reset} where API limitations are acceptable`,
  );
  recommendations.push(
    `${colors.red}Avoid tailwind-variants${colors.reset} for ${colors.bright}performance-critical${colors.reset} applications`,
  );

  return recommendations;
}
