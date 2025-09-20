/**
 * Tailwind Variants Performance Benchmark
 *
 * This benchmark compares the performance of different Tailwind CSS variant libraries:
 * 1. `tailwind-variants` (original library)
 * 2. `class-variance-authority` (CVA)
 * 3. `class-variance-authority` + `tailwind-merge`
 * 4. `@codefast/tailwind-variants` (custom implementation)
 */

import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { tv as originalTV } from "tailwind-variants";
import { Bench } from "tinybench";

import { tv as codefastTV } from "@codefast/tailwind-variants";

// Sample variant configurations for testing
const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: "h-10 py-2 px-4",
      icon: "h-10 w-10",
      lg: "h-11 px-8 rounded-md",
      sm: "h-9 px-3 rounded-md",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  },
} as const;

const complexVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  compoundVariants: [
    {
      class: "text-lg font-bold",
      size: "lg",
      variant: "destructive",
    },
    {
      class: "cursor-not-allowed",
      disabled: true,
      loading: true,
    },
  ],
  defaultVariants: {
    disabled: false,
    loading: false,
    size: "default",
    variant: "default",
  },
  variants: {
    disabled: {
      false: "",
      true: "opacity-50 pointer-events-none",
    },
    loading: {
      false: "",
      true: "animate-spin",
    },
    size: {
      default: "h-10 py-2 px-4",
      icon: "h-10 w-10",
      lg: "h-11 px-8 rounded-md",
      sm: "h-9 px-3 rounded-md",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  },
} as const;

// Initialize benchmark functions
const originalTVFunction = originalTV(buttonVariants);
const codefastTVFunction = codefastTV(buttonVariants);

const cvaFunction = cva(buttonVariants.base, {
  defaultVariants: buttonVariants.defaultVariants,
  variants: buttonVariants.variants,
});

// Complex variants for advanced testing
const originalTVComplex = originalTV(complexVariants);
const codefastTVComplex = codefastTV(complexVariants);

const cvaComplex = cva(complexVariants.base, {
  compoundVariants: complexVariants.compoundVariants,
  defaultVariants: complexVariants.defaultVariants,
  variants: complexVariants.variants,
});

// Test data
const testProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg" } as const,
  { className: "custom-class", size: "sm", variant: "outline" } as const,
  { size: "icon", variant: "ghost" } as const,
  { className: "custom-class", variant: "link" } as const,
];

const complexTestProps = [
  {} as const,
  { size: "lg", variant: "destructive" } as const,
  { disabled: true, loading: true } as const,
  { disabled: false, size: "sm", variant: "outline" } as const,
  { loading: true, size: "icon", variant: "ghost" } as const,
  { className: "custom-class", disabled: true, variant: "link" } as const,
];

/**
 * Create and run the benchmark suite
 */
export async function runBenchmark(): Promise<void> {
  const bench = new Bench({
    iterations: 1000, // 1000 iterations
    time: 1000, // 1 second per benchmark
    warmupIterations: 100, // 100 warmup iterations
  });

  console.log("Starting Tailwind Variants Performance Benchmark...\n");

  // Simple variant benchmarks
  console.log("=== Simple Variants Benchmark ===");

  bench.add("[simple] tailwind-variants (original)", () => {
    for (const props of testProps) {
      originalTVFunction(props);
    }
  });

  bench.add("[simple] class-variance-authority", () => {
    for (const props of testProps) {
      cvaFunction(props);
    }
  });

  bench.add("[simple] class-variance-authority + tailwind-merge", () => {
    for (const props of testProps) {
      twMerge(cvaFunction(props));
    }
  });

  bench.add("[simple] @codefast/tailwind-variants", () => {
    for (const props of testProps) {
      codefastTVFunction(props);
    }
  });

  // Complex variant benchmarks
  console.log("\n=== Complex Variants Benchmark ===");

  bench.add("[complex] tailwind-variants (original)", () => {
    for (const props of complexTestProps) {
      originalTVComplex(props);
    }
  });

  bench.add("[complex] class-variance-authority", () => {
    for (const props of complexTestProps) {
      cvaComplex(props);
    }
  });

  bench.add("[complex] class-variance-authority + tailwind-merge", () => {
    for (const props of complexTestProps) {
      twMerge(cvaComplex(props));
    }
  });

  bench.add("[complex] @codefast/tailwind-variants", () => {
    for (const props of complexTestProps) {
      codefastTVComplex(props);
    }
  });

  // Run the benchmark
  await bench.run();

  // Display results
  console.log("\n=== Benchmark Results ===");
  console.table(bench.table());

  // Display summary
  console.log("\n=== Performance Summary ===");
  const results = bench.results;

  if (results.length > 0) {
    const fastest = results.reduce((previous, current) => {
      if (!previous) {
        return current;
      }

      if (!current) {
        return previous;
      }

      return previous.hz > current.hz ? previous : current;
    });

    const slowest = results.reduce((previous, current) => {
      if (!previous) {
        return current;
      }

      if (!current) {
        return previous;
      }

      return previous.hz < current.hz ? previous : current;
    });

    if (fastest && slowest) {
      const fastestName = (fastest as { name?: string }).name ?? "Unknown";
      const slowestName = (slowest as { name?: string }).name ?? "Unknown";

      console.log(`Fastest: ${fastestName} (${fastest.hz.toFixed(2)} ops/sec)`);
      console.log(`Slowest: ${slowestName} (${slowest.hz.toFixed(2)} ops/sec)`);
      console.log(`Performance ratio: ${(fastest.hz / slowest.hz).toFixed(2)}x`);
    }
  }

  console.log("\nBenchmark completed!");
}
