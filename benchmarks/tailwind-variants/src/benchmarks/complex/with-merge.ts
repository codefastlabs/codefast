/**
 * Complex Variants With Tailwind Merge Benchmark
 *
 * Benchmarks complex variant functionality with tailwind-merge
 */

import { twMerge } from "tailwind-merge";
import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_ENABLED } from "#/bench-options";
import { cva, codefastTV, originalTV } from "#/benchmark-tv";
import { complexTestProps, complexVariants } from "#/benchmarks/complex/data";

// Initialize benchmark functions
const originalTVComplex = originalTV(complexVariants, TV_MERGE_ENABLED);
const codefastTVComplex = codefastTV(complexVariants, TV_MERGE_ENABLED);
const cvaComplex = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Create complex variants benchmark with tailwind-merge
 */
export function createComplexWithMergeBenchmark(name = "Complex Variants (With Tailwind Merge)") {
  const bench = new Bench({
    name,
    ...BENCH_OPTIONS,
  });

  bench
    .add("tailwind-variants", () => {
      for (const props of complexTestProps) {
        originalTVComplex(props);
      }
    })
    .add("@codefast/tailwind-variants", () => {
      for (const props of complexTestProps) {
        codefastTVComplex(props);
      }
    })
    .add("class-variance-authority", () => {
      for (const props of complexTestProps) {
        twMerge(cvaComplex(props));
      }
    });

  return bench;
}
