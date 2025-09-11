#!/usr/bin/env tsx

/**
 * Main benchmark runner for TV library
 * Compares performance with tailwind-variants and class-variance-authority
 */

import type { BenchmarkResults } from "./analyzer";

import { analyzeResults } from "./analyzer";
import {
  runAdvancedCardBenchmark,
  runBasicVariantsBenchmark,
  runClassCompoundVariantsBenchmark,
  runClassPropertyBenchmark,
  runClassSlotsBenchmark,
  runComplexButtonBenchmark,
  runCompoundVariantsBenchmark,
  runDataTableBenchmark,
  runFormComponentsBenchmark,
  runLargeDatasetBenchmark,
  runMixedPropertiesBenchmark,
  runRealWorldComponentsBenchmark,
  runResponsiveLayoutBenchmark,
  runSlotsBenchmark,
} from "./suites";
import { LIBRARY_NAMES } from "./utils";

/**
 * Main benchmark runner
 */
const runBenchmarks = (): BenchmarkResults => {
  console.log("🚀 Starting Benchmark Comparison");
  console.log("═".repeat(60));
  console.log(
    `📊 Comparing: ${LIBRARY_NAMES.TV} vs ${LIBRARY_NAMES.TV_NPM} vs ${LIBRARY_NAMES.CVA} vs ${LIBRARY_NAMES.CVA_MERGE}`,
  );
  console.log("═".repeat(60));

  // Run all benchmark suites
  const basicResults = runBasicVariantsBenchmark();
  const compoundResults = runCompoundVariantsBenchmark();
  const slotsResults = runSlotsBenchmark();
  const largeResults = runLargeDatasetBenchmark();
  const complexButtonResults = runComplexButtonBenchmark();
  const advancedCardResults = runAdvancedCardBenchmark();
  const responsiveLayoutResults = runResponsiveLayoutBenchmark();
  const formComponentsResults = runFormComponentsBenchmark();
  const dataTableResults = runDataTableBenchmark();
  const realWorldComponentsResults = runRealWorldComponentsBenchmark();

  // Run class property benchmarks
  const classPropertyResults = runClassPropertyBenchmark();
  const classCompoundResults = runClassCompoundVariantsBenchmark();
  const classSlotsResults = runClassSlotsBenchmark();
  const mixedPropertiesResults = runMixedPropertiesBenchmark();

  // Analyze and display results
  const results: BenchmarkResults = {
    advancedCard: advancedCardResults,
    basic: basicResults,
    classCompound: classCompoundResults,
    classProperty: classPropertyResults,
    classSlots: classSlotsResults,
    complexButton: complexButtonResults,
    compound: compoundResults,
    dataTable: dataTableResults,
    formComponents: formComponentsResults,
    large: largeResults,
    mixedProperties: mixedPropertiesResults,
    realWorldComponents: realWorldComponentsResults,
    responsiveLayout: responsiveLayoutResults,
    slots: slotsResults,
  };

  analyzeResults(results);

  console.log("\n✓ Benchmark completed successfully!");

  return results;
};

/**
 * Run specific benchmark suite
 */
export const runSpecificBenchmark = (suite: keyof BenchmarkResults): void => {
  console.log(`Running ${suite} benchmark...\n`);

  switch (suite) {
    case "basic": {
      runBasicVariantsBenchmark();
      break;
    }

    case "compound": {
      runCompoundVariantsBenchmark();
      break;
    }

    case "slots": {
      runSlotsBenchmark();
      break;
    }

    case "large": {
      runLargeDatasetBenchmark();
      break;
    }

    case "complexButton": {
      runComplexButtonBenchmark();
      break;
    }

    case "advancedCard": {
      runAdvancedCardBenchmark();
      break;
    }

    case "responsiveLayout": {
      runResponsiveLayoutBenchmark();
      break;
    }

    case "formComponents": {
      runFormComponentsBenchmark();
      break;
    }

    case "dataTable": {
      runDataTableBenchmark();
      break;
    }

    case "realWorldComponents": {
      runRealWorldComponentsBenchmark();
      break;
    }

    case "classProperty": {
      runClassPropertyBenchmark();
      break;
    }

    case "classCompound": {
      runClassCompoundVariantsBenchmark();
      break;
    }

    case "classSlots": {
      runClassSlotsBenchmark();
      break;
    }

    case "mixedProperties": {
      runMixedPropertiesBenchmark();
      break;
    }

    default: {
      console.log(`✗ Unknown benchmark suite: ${String(suite)}`);
      process.exit(1);
    }
  }
};

// Run benchmarks if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = process.argv[2];

  if (suite) {
    runSpecificBenchmark(suite as keyof BenchmarkResults);
  } else {
    runBenchmarks();
  }
}

export { runBenchmarks };
