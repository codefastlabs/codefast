/**
 * Complex Variants Without Tailwind Merge Benchmark
 *
 * Benchmarks complex variant functionality without tailwind-merge
 */

import { cva } from 'class-variance-authority';
import { tv as originalTV } from 'tailwind-variants';
import { Bench } from 'tinybench';

import { complexTestProps, complexVariants } from './data.js';
import { tv as codefastTV } from '@codefast/tailwind-variants';

// Initialize benchmark functions
const originalTVComplex = originalTV(complexVariants, { twMerge: false });
const codefastTVComplex = codefastTV(complexVariants, { twMerge: false });
const cvaComplex = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

/**
 * Create complex variants benchmark without tailwind-merge
 */
export function createComplexWithoutMergeBenchmark(name = 'Complex Variants') {
  const bench = new Bench({
    name,
    iterations: 1000,
    time: 1000,
    warmupIterations: 100,
    warmupTime: 100,
  });

  bench
    .add('tailwind-variants', () => {
      for (const props of complexTestProps) {
        originalTVComplex(props);
      }
    })
    .add('class-variance-authority', () => {
      for (const props of complexTestProps) {
        cvaComplex(props);
      }
    })
    .add('@codefast/tailwind-variants', () => {
      for (const props of complexTestProps) {
        codefastTVComplex(props);
      }
    });

  return bench;
}
