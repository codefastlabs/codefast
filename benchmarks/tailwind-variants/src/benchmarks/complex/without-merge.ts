/**
 * Complex Variants Without Tailwind Merge Benchmark
 *
 * Benchmarks complex variant functionality without tailwind-merge
 */

import { Bench } from "tinybench";

import { BENCH_OPTIONS, TV_MERGE_DISABLED } from "#/bench-options";
import { cva, codefastTV, originalTV } from "#/benchmark-tv";
import { complexTestProps, complexVariants } from "#/benchmarks/complex/data";

// Initialize benchmark functions
const originalTVComplex = originalTV(complexVariants, TV_MERGE_DISABLED);
const codefastTVComplex = codefastTV(complexVariants, TV_MERGE_DISABLED);
const cvaComplex = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Create complex variants benchmark without tailwind-merge
 */
export function createComplexWithoutMergeBenchmark(name = "Complex Variants") {
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
        cvaComplex(props);
      }
    });

  return bench;
}
