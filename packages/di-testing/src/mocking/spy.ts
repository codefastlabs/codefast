/** The built-in zero-dependency spy the default mock factory hands out. */

/**
 * One recorded invocation's outcome — a returned value or a thrown error.
 *
 * @since 0.1.0
 */
export interface SpyResult {
  readonly type: "return" | "throw";
  readonly value: unknown;
}

/**
 * The call log a spy exposes for assertions.
 *
 * @typeParam Args - The spy's argument tuple.
 *
 * @since 0.1.0
 */
export interface SpyState<Args extends ReadonlyArray<unknown>> {
  readonly calls: ReadonlyArray<Args>;
  readonly results: ReadonlyArray<SpyResult>;
}

/* oxlint-disable typescript/no-explicit-any -- a spy must be assignable to any return type */
/**
 * The built-in zero-dependency spy: callable, records calls, and takes a return value or implementation.
 *
 * @remarks `Return` defaults to `any` so a spy drops into any typed method slot, exactly as Vitest's
 * own mock type does — the package's one deliberate `any`.
 *
 * @since 0.1.0
 */
export interface Spy<Args extends ReadonlyArray<unknown> = ReadonlyArray<unknown>, Return = any> {
  (...args: Args): Return;
  /** The recorded calls and their outcomes. */
  readonly mock: SpyState<Args>;
  /** Sets a fixed value returned by every subsequent call. */
  mockReturnValue(value: Return): this;
  /** Replaces the spy's behaviour with `fn`, still recording each call. */
  mockImplementation(fn: (...args: Args) => Return): this;
  /** Clears the recorded calls and any configured return value or implementation. */
  mockReset(): void;
}
/* oxlint-enable typescript/no-explicit-any */

/**
 * Creates a fresh zero-dependency spy that records its calls and returns `undefined` until configured.
 *
 * @since 0.1.0
 */
export function createSpy(): Spy {
  const calls: Array<ReadonlyArray<unknown>> = [];
  const results: Array<SpyResult> = [];
  let implementation: ((...args: ReadonlyArray<unknown>) => unknown) | undefined;
  let returnValue: unknown;

  const spy = Object.assign(
    (...args: ReadonlyArray<unknown>): unknown => {
      calls.push(args);
      try {
        const value = implementation === undefined ? returnValue : implementation(...args);
        results.push({ type: "return", value });
        return value;
      } catch (error) {
        results.push({ type: "throw", value: error });
        throw error;
      }
    },
    {
      mock: { calls, results },
      mockReturnValue(value: unknown): Spy {
        returnValue = value;
        implementation = undefined;
        return spy;
      },
      mockImplementation(fn: (...args: ReadonlyArray<unknown>) => unknown): Spy {
        implementation = fn;
        return spy;
      },
      // Cleared in place so `mock` stays one stable object across resets.
      mockReset(): void {
        calls.length = 0;
        results.length = 0;
        implementation = undefined;
        returnValue = undefined;
      },
    },
  ) as Spy;

  return spy;
}
