/**
 * Benchmark suites for different scenarios
 */

// eslint-disable-next-line import-x/no-extraneous-dependencies
import { tv as tailwindVariants } from "tailwind-variants";

import { tv } from "@/index";

import type { BenchmarkResult, BenchmarkResults } from "./utils";

import { benchmarkConfigs, testCases } from "./configs";
import {
  createLibraryInstances,
  createTableHeader,
  createTableRow,
  displayBenchmarkTable,
  findFastest,
  LIBRARY_KEYS,
  LIBRARY_NAMES,
  runAllBenchmarks,
  runBenchmark,
} from "./utils";

/**
 * Type-safe result handler for TV instances
 */
const handleTVResult = (result: unknown, slots: string[]): void => {
  const typedResult = result as Record<string, () => string>;

  for (const slot of slots) {
    typedResult[slot]();
  }
};

/**
 * Benchmark suite result type
 */
type BenchmarkSuiteResult = BenchmarkResults;

/**
 * Basic variants benchmark suite
 */
export const runBasicVariantsBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n🚀 Basic Variants Benchmark");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.basic);
  const results = runAllBenchmarks(instances, testCases.basic);

  displayBenchmarkTable(results);

  return results;
};

/**
 * Compound variants benchmark suite
 */
export const runCompoundVariantsBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n🔗 Compound Variants Benchmark");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.compound);
  const results = runAllBenchmarks(instances, testCases.compound);

  displayBenchmarkTable(results);

  return results;
};

/**
 * Slots benchmark suite
 */
export const runSlotsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n🎯 Slots Benchmark");
  console.log("═".repeat(60));

  const tvInstance = tv(benchmarkConfigs.slots);
  const tvLibInstance = tailwindVariants(benchmarkConfigs.slots);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.slots) {
      const result = tvInstance(props);

      handleTVResult(result, ["base", "icon", "label"]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.slots) {
      const result = tvLibInstance(props);

      handleTVResult(result, ["base", "icon", "label"]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Large dataset benchmark suite
 */
export const runLargeDatasetBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n📊 Large Dataset Benchmark");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.large);
  const results = runAllBenchmarks(instances, testCases.large, 500);

  displayBenchmarkTable(results);

  return results;
};

/**
 * Complex button benchmark suite
 */
export const runComplexButtonBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n🔘 Complex Button Benchmark");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.complexButton);
  const results = runAllBenchmarks(instances, testCases.complexButton);

  displayBenchmarkTable(results);

  return results;
};

/**
 * Advanced card benchmark suite
 */
export const runAdvancedCardBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n🃏 Advanced Card Benchmark");
  console.log("═".repeat(60));

  const advancedCardConfig = {
    ...benchmarkConfigs.advancedCard,
    compoundVariants: [...benchmarkConfigs.advancedCard.compoundVariants],
  };

  const tvInstance = tv(advancedCardConfig);
  const tvLibInstance = tailwindVariants(advancedCardConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.advancedCard) {
      const result = tvInstance(props);

      handleTVResult(result, ["base", "header", "content", "footer", "actions"]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.advancedCard) {
      const result = tvLibInstance(props);

      handleTVResult(result, ["base", "header", "content", "footer", "actions"]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Responsive layout benchmark suite
 */
export const runResponsiveLayoutBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n📱 Responsive Layout Benchmark");
  console.log("═".repeat(60));

  const responsiveLayoutConfig = {
    ...benchmarkConfigs.responsiveLayout,
    compoundVariants: [...benchmarkConfigs.responsiveLayout.compoundVariants],
  };

  const tvInstance = tv(responsiveLayoutConfig);
  const tvLibInstance = tailwindVariants(responsiveLayoutConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.responsiveLayout) {
      const result = tvInstance(props);

      handleTVResult(result, [
        "base",
        "header",
        "sidebar",
        "main",
        "content",
        "footer",
        "navigation",
        "mobileMenu",
      ]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.responsiveLayout) {
      const result = tvLibInstance(props);

      handleTVResult(result, [
        "base",
        "header",
        "sidebar",
        "main",
        "content",
        "footer",
        "navigation",
        "mobileMenu",
      ]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Form components benchmark suite
 */
export const runFormComponentsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n📝 Form Components Benchmark");
  console.log("═".repeat(60));

  const formComponentsConfig = {
    ...benchmarkConfigs.formComponents,
    compoundVariants: [...benchmarkConfigs.formComponents.compoundVariants],
  };

  const tvInstance = tv(formComponentsConfig);
  const tvLibInstance = tailwindVariants(formComponentsConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.formComponents) {
      const result = tvInstance(props);

      handleTVResult(result, [
        "base",
        "field",
        "label",
        "input",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "error",
        "help",
      ]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.formComponents) {
      const result = tvLibInstance(props);

      handleTVResult(result, [
        "base",
        "field",
        "label",
        "input",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "error",
        "help",
      ]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Data table benchmark suite
 */
export const runDataTableBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n📋 Data Table Benchmark");
  console.log("═".repeat(60));

  const dataTableConfig = {
    ...benchmarkConfigs.dataTable,
    compoundVariants: [...benchmarkConfigs.dataTable.compoundVariants],
  };

  const tvInstance = tv(dataTableConfig);
  const tvLibInstance = tailwindVariants(dataTableConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.dataTable) {
      const result = tvInstance(props);

      handleTVResult(result, [
        "base",
        "container",
        "header",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "footer",
        "pagination",
        "search",
        "filters",
      ]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.dataTable) {
      const result = tvLibInstance(props);

      handleTVResult(result, [
        "base",
        "container",
        "header",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "footer",
        "pagination",
        "search",
        "filters",
      ]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Real-world components benchmark suite
 */
export const runRealWorldComponentsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n🌍 Real-world Components Benchmark");
  console.log("═".repeat(60));

  const realWorldComponentsConfig = {
    ...benchmarkConfigs.realWorldComponents,
    compoundVariants: [...benchmarkConfigs.realWorldComponents.compoundVariants],
  };

  const tvInstance = tv(realWorldComponentsConfig);
  const tvLibInstance = tailwindVariants(realWorldComponentsConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.realWorldComponents) {
      const result = tvInstance(props);

      handleTVResult(result, [
        "base",
        "container",
        "header",
        "content",
        "footer",
        "actions",
        "icon",
        "label",
        "description",
        "badge",
        "avatar",
        "menu",
        "dropdown",
        "modal",
        "drawer",
        "tooltip",
        "popover",
      ]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.realWorldComponents) {
      const result = tvLibInstance(props);

      handleTVResult(result, [
        "base",
        "container",
        "header",
        "content",
        "footer",
        "actions",
        "icon",
        "label",
        "description",
        "badge",
        "avatar",
        "menu",
        "dropdown",
        "modal",
        "drawer",
        "tooltip",
        "popover",
      ]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Class property benchmark suite (Vue/Svelte style)
 */
export const runClassPropertyBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n🎨 Class Property Benchmark (Vue/Svelte Style)");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.basicClass);
  const results = runAllBenchmarks(instances, testCases.basicClass);

  displayBenchmarkTable(results);

  return results;
};

/**
 * Class compound variants benchmark suite
 */
export const runClassCompoundVariantsBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n🔗 Class Compound Variants Benchmark");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.compoundClass);
  const results = runAllBenchmarks(instances, testCases.compoundClass);

  displayBenchmarkTable(results);

  return results;
};

/**
 * Class slots benchmark suite
 */
export const runClassSlotsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\n🎯 Class Slots Benchmark");
  console.log("═".repeat(60));

  const tvInstance = tv(benchmarkConfigs.slotsClass);
  const tvLibInstance = tailwindVariants(benchmarkConfigs.slotsClass);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.slotsClass) {
      const result = tvInstance(props);

      handleTVResult(result, ["base", "icon", "label"]);
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.slotsClass) {
      const result = tvLibInstance(props);

      handleTVResult(result, ["base", "icon", "label"]);
    }
  });

  const results = { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };

  // Display results in a formatted table
  console.log(createTableHeader());
  console.log(createTableRow(LIBRARY_NAMES.TV, tvResult.avg, tvResult.min, tvResult.max));
  console.log(
    createTableRow(LIBRARY_NAMES.TV_NPM, tvLibResult.avg, tvLibResult.min, tvLibResult.max),
  );
  console.log(`${LIBRARY_NAMES.CVA}:`.padEnd(32) + " N/A".padStart(27));

  // Show fastest
  const [fastestName, fastestResult] = findFastest(results);

  console.log(`\n🏆 Fastest: ${fastestName} (${fastestResult.avg.toFixed(2)}ms)`);

  return results;
};

/**
 * Mixed properties benchmark suite (className + class)
 */
export const runMixedPropertiesBenchmark = (): BenchmarkSuiteResult => {
  console.log("\n🔄 Mixed Properties Benchmark (className + class)");
  console.log("═".repeat(60));

  const instances = createLibraryInstances(benchmarkConfigs.mixedProperties);
  const results = runAllBenchmarks(instances, testCases.mixedProperties);

  displayBenchmarkTable(results);

  return results;
};
