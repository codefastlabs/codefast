/**
 * Wraps a sub-μs closure in a fixed-size inner loop so tinybench's
 * `performance.now()` timing (μs resolution) samples a non-trivial amount of
 * work per iteration.
 *
 * Use with any scenario whose single operation completes in well under 1 μs
 * (constant-resolve, rotate-constants, named-constant-get). The scenario
 * declaration must set `batch` to the same factor so the reporter can multiply
 * tinybench's throughput by this number to get the per-operation rate.
 *
 * @example
 * {
 *   id: "constant-resolve",
 *   batch: 1000,
 *   build: () => batched(1000, () => container.resolve(token)),
 * }
 *
 * @since 0.3.16-canary.0
 */
export function batched(factor: number, operation: () => void): () => void {
  if (!Number.isInteger(factor) || factor < 1) {
    throw new Error(`batched() factor must be a positive integer, received ${String(factor)}`);
  }
  if (factor === 1) {
    return operation;
  }
  // Unrolled-ish: Node v22's V8 inlines tight loops well enough that a simple
  // `for` is as fast as manual unrolling for this shape of work.
  return () => {
    for (let iterationIndex = 0; iterationIndex < factor; iterationIndex++) {
      operation();
    }
  };
}
