/**
 * Benchmark suites for different scenarios
 */

// eslint-disable-next-line import-x/no-extraneous-dependencies
import { cva } from "class-variance-authority";
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { tv as tailwindVariants } from "tailwind-variants";

import type { BenchmarkResult } from "./utils";

import { tv } from "../dist";
import { benchmarkConfigs, testCases } from "./configs";
import { LIBRARY_KEYS, LIBRARY_NAMES, runBenchmark } from "./utils";

/**
 * Basic variants benchmark suite
 */
export const runBasicVariantsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("Basic Variants Benchmark");
  console.log("=".repeat(50));

  const tvInstance = tv(benchmarkConfigs.basic);
  const tvLibInstance = tailwindVariants(benchmarkConfigs.basic);
  const cvaInstance = cva(benchmarkConfigs.basic.base, {
    defaultVariants: benchmarkConfigs.basic.defaultVariants,
    variants: benchmarkConfigs.basic.variants,
  });

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.basic) tvInstance(props);
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.basic) tvLibInstance(props);
  });

  const cvaResult = runBenchmark(LIBRARY_NAMES.CVA, () => {
    for (const props of testCases.basic) cvaInstance(props);
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.CVA}:    ${cvaResult.avg.toFixed(2)}ms avg (${cvaResult.min.toFixed(2)}-${cvaResult.max.toFixed(2)}ms)`,
  );

  return {
    [LIBRARY_KEYS.CVA]: cvaResult,
    [LIBRARY_KEYS.TV]: tvResult,
    [LIBRARY_KEYS.TV_NPM]: tvLibResult,
  };
};

/**
 * Compound variants benchmark suite
 */
export const runCompoundVariantsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nCompound Variants Benchmark");
  console.log("=".repeat(50));

  const compoundConfig = {
    ...benchmarkConfigs.compound,
    compoundVariants: [...benchmarkConfigs.compound.compoundVariants],
  };

  const tvInstance = tv(compoundConfig);
  const tvLibInstance = tailwindVariants(compoundConfig);
  const cvaInstance = cva(compoundConfig.base, {
    compoundVariants: compoundConfig.compoundVariants,
    defaultVariants: compoundConfig.defaultVariants,
    variants: compoundConfig.variants,
  });

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.compound) tvInstance(props);
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.compound) tvLibInstance(props);
  });

  const cvaResult = runBenchmark(LIBRARY_NAMES.CVA, () => {
    for (const props of testCases.compound) cvaInstance(props);
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.CVA}:    ${cvaResult.avg.toFixed(2)}ms avg (${cvaResult.min.toFixed(2)}-${cvaResult.max.toFixed(2)}ms)`,
  );

  return {
    [LIBRARY_KEYS.CVA]: cvaResult,
    [LIBRARY_KEYS.TV]: tvResult,
    [LIBRARY_KEYS.TV_NPM]: tvLibResult,
  };
};

/**
 * Slots benchmark suite
 */
export const runSlotsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nSlots Benchmark");
  console.log("=".repeat(50));

  const tvInstance = tv(benchmarkConfigs.slots);
  const tvLibInstance = tailwindVariants(benchmarkConfigs.slots);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.slots) {
      const result = tvInstance(props);

      result.base();
      result.icon();
      result.label();
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.slots) {
      const result = tvLibInstance(props);

      result.base();
      result.icon();
      result.label();
    }
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(`${LIBRARY_NAMES.CVA}:    N/A (no slots support)`);

  return { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };
};

/**
 * Large dataset benchmark suite
 */
export const runLargeDatasetBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nLarge Dataset Benchmark");
  console.log("=".repeat(50));

  const largeConfig = {
    ...benchmarkConfigs.large,
    compoundVariants: [...benchmarkConfigs.large.compoundVariants],
  };

  const tvInstance = tv(largeConfig);
  const tvLibInstance = tailwindVariants(largeConfig);
  const cvaInstance = cva(largeConfig.base, {
    compoundVariants: largeConfig.compoundVariants,
    variants: largeConfig.variants,
  });

  const tvResult = runBenchmark(
    LIBRARY_NAMES.TV,
    () => {
      for (const props of testCases.large) tvInstance(props);
    },
    500,
  );

  const tvLibResult = runBenchmark(
    LIBRARY_NAMES.TV_NPM,
    () => {
      for (const props of testCases.large) tvLibInstance(props);
    },
    500,
  );

  const cvaResult = runBenchmark(
    LIBRARY_NAMES.CVA,
    () => {
      for (const props of testCases.large) cvaInstance(props);
    },
    500,
  );

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.CVA}:    ${cvaResult.avg.toFixed(2)}ms avg (${cvaResult.min.toFixed(2)}-${cvaResult.max.toFixed(2)}ms)`,
  );

  return {
    [LIBRARY_KEYS.CVA]: cvaResult,
    [LIBRARY_KEYS.TV]: tvResult,
    [LIBRARY_KEYS.TV_NPM]: tvLibResult,
  };
};

/**
 * Complex button benchmark suite
 */
export const runComplexButtonBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nComplex Button Benchmark");
  console.log("=".repeat(50));

  const complexButtonConfig = {
    ...benchmarkConfigs.complexButton,
    compoundVariants: [...benchmarkConfigs.complexButton.compoundVariants],
  };

  const tvInstance = tv(complexButtonConfig);
  const tvLibInstance = tailwindVariants(complexButtonConfig);
  const cvaInstance = cva(complexButtonConfig.base, {
    compoundVariants: complexButtonConfig.compoundVariants,
    defaultVariants: complexButtonConfig.defaultVariants,
    variants: complexButtonConfig.variants,
  });

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.complexButton) tvInstance(props);
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.complexButton) tvLibInstance(props);
  });

  const cvaResult = runBenchmark(LIBRARY_NAMES.CVA, () => {
    for (const props of testCases.complexButton) cvaInstance(props);
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.CVA}:    ${cvaResult.avg.toFixed(2)}ms avg (${cvaResult.min.toFixed(2)}-${cvaResult.max.toFixed(2)}ms)`,
  );

  return {
    [LIBRARY_KEYS.CVA]: cvaResult,
    [LIBRARY_KEYS.TV]: tvResult,
    [LIBRARY_KEYS.TV_NPM]: tvLibResult,
  };
};

/**
 * Advanced card benchmark suite
 */
export const runAdvancedCardBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nAdvanced Card Benchmark");
  console.log("=".repeat(50));

  const advancedCardConfig = {
    ...benchmarkConfigs.advancedCard,
    compoundVariants: [...benchmarkConfigs.advancedCard.compoundVariants],
  };

  const tvInstance = tv(advancedCardConfig);
  const tvLibInstance = tailwindVariants(advancedCardConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.advancedCard) {
      const result = tvInstance(props);

      result.base();
      result.header();
      result.content();
      result.footer();
      result.actions();
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.advancedCard) {
      const result = tvLibInstance(props);

      result.base();
      result.header();
      result.content();
      result.footer();
      result.actions();
    }
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(`${LIBRARY_NAMES.CVA}:    N/A (no slots support)`);

  return { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };
};

/**
 * Responsive layout benchmark suite
 */
export const runResponsiveLayoutBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nResponsive Layout Benchmark");
  console.log("=".repeat(50));

  const responsiveLayoutConfig = {
    ...benchmarkConfigs.responsiveLayout,
    compoundVariants: [...benchmarkConfigs.responsiveLayout.compoundVariants],
  };

  const tvInstance = tv(responsiveLayoutConfig);
  const tvLibInstance = tailwindVariants(responsiveLayoutConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.responsiveLayout) {
      const result = tvInstance(props);

      result.base();
      result.header();
      result.sidebar();
      result.main();
      result.content();
      result.footer();
      result.navigation();
      result.mobileMenu();
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.responsiveLayout) {
      const result = tvLibInstance(props);

      result.base();
      result.header();
      result.sidebar();
      result.main();
      result.content();
      result.footer();
      result.navigation();
      result.mobileMenu();
    }
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(`${LIBRARY_NAMES.CVA}:    N/A (no slots support)`);

  return { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };
};

/**
 * Form components benchmark suite
 */
export const runFormComponentsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nForm Components Benchmark");
  console.log("=".repeat(50));

  const formComponentsConfig = {
    ...benchmarkConfigs.formComponents,
    compoundVariants: [...benchmarkConfigs.formComponents.compoundVariants],
  };

  const tvInstance = tv(formComponentsConfig);
  const tvLibInstance = tailwindVariants(formComponentsConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.formComponents) {
      const result = tvInstance(props);

      result.base();
      result.field();
      result.label();
      result.input();
      result.textarea();
      result.select();
      result.checkbox();
      result.radio();
      result.error();
      result.help();
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.formComponents) {
      const result = tvLibInstance(props);

      result.base();
      result.field();
      result.label();
      result.input();
      result.textarea();
      result.select();
      result.checkbox();
      result.radio();
      result.error();
      result.help();
    }
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(`${LIBRARY_NAMES.CVA}:    N/A (no slots support)`);

  return { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };
};

/**
 * Data table benchmark suite
 */
export const runDataTableBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nData Table Benchmark");
  console.log("=".repeat(50));

  const dataTableConfig = {
    ...benchmarkConfigs.dataTable,
    compoundVariants: [...benchmarkConfigs.dataTable.compoundVariants],
  };

  const tvInstance = tv(dataTableConfig);
  const tvLibInstance = tailwindVariants(dataTableConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.dataTable) {
      const result = tvInstance(props);

      result.base();
      result.container();
      result.header();
      result.table();
      result.thead();
      result.tbody();
      result.tr();
      result.th();
      result.td();
      result.footer();
      result.pagination();
      result.search();
      result.filters();
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.dataTable) {
      const result = tvLibInstance(props);

      result.base();
      result.container();
      result.header();
      result.table();
      result.thead();
      result.tbody();
      result.tr();
      result.th();
      result.td();
      result.footer();
      result.pagination();
      result.search();
      result.filters();
    }
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(`${LIBRARY_NAMES.CVA}:    N/A (no slots support)`);

  return { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };
};

/**
 * Real-world components benchmark suite
 */
export const runRealWorldComponentsBenchmark = (): Record<string, BenchmarkResult> => {
  console.log("\nReal-world Components Benchmark");
  console.log("=".repeat(50));

  const realWorldComponentsConfig = {
    ...benchmarkConfigs.realWorldComponents,
    compoundVariants: [...benchmarkConfigs.realWorldComponents.compoundVariants],
  };

  const tvInstance = tv(realWorldComponentsConfig);
  const tvLibInstance = tailwindVariants(realWorldComponentsConfig);

  const tvResult = runBenchmark(LIBRARY_NAMES.TV, () => {
    for (const props of testCases.realWorldComponents) {
      const result = tvInstance(props);

      // Test all slots
      result.base();
      result.container();
      result.header();
      result.content();
      result.footer();
      result.actions();
      result.icon();
      result.label();
      result.description();
      result.badge();
      result.avatar();
      result.menu();
      result.dropdown();
      result.modal();
      result.drawer();
      result.tooltip();
      result.popover();
    }
  });

  const tvLibResult = runBenchmark(LIBRARY_NAMES.TV_NPM, () => {
    for (const props of testCases.realWorldComponents) {
      const result = tvLibInstance(props);

      // Test all slots
      result.base();
      result.container();
      result.header();
      result.content();
      result.footer();
      result.actions();
      result.icon();
      result.label();
      result.description();
      result.badge();
      result.avatar();
      result.menu();
      result.dropdown();
      result.modal();
      result.drawer();
      result.tooltip();
      result.popover();
    }
  });

  console.log(
    `${LIBRARY_NAMES.TV}: ${tvResult.avg.toFixed(2)}ms avg (${tvResult.min.toFixed(2)}-${tvResult.max.toFixed(2)}ms)`,
  );
  console.log(
    `${LIBRARY_NAMES.TV_NPM}:     ${tvLibResult.avg.toFixed(2)}ms avg (${tvLibResult.min.toFixed(2)}-${tvLibResult.max.toFixed(2)}ms)`,
  );
  console.log(`${LIBRARY_NAMES.CVA}:    N/A (no slots support)`);

  return { [LIBRARY_KEYS.TV]: tvResult, [LIBRARY_KEYS.TV_NPM]: tvLibResult };
};
