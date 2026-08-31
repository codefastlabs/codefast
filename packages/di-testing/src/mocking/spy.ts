/** The built-in zero-dependency spy the default mock factory hands out. */

/**
 * One recorded invocation's outcome — a returned value or a thrown error.
 */
export interface SpyResult {
  readonly type: "return" | "throw";
  readonly value: unknown;
}

/**
 * The call log a spy exposes for assertions.
 *
 * @typeParam Args - The spy's argument tuple.
 */
export interface SpyState<Args extends ReadonlyArray<unknown>> {
  readonly calls: ReadonlyArray<Args>;
  readonly results: ReadonlyArray<SpyResult>;
}

// The `Return` default is `any` so a spy drops into any typed method slot a stub supplies —
// the same reason Vitest's own mock call signature returns `any`. This is the package's only `any`.
// oxlint-disable-next-line typescript/no-explicit-any -- a spy must be assignable to any return type
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

/**
 * Creates a fresh zero-dependency spy that records its calls and returns `undefined` until configured.
 */
export function createSpy(): Spy {
  let calls: Array<ReadonlyArray<unknown>> = [];
  let results: Array<SpyResult> = [];
  let implementation: ((...args: ReadonlyArray<unknown>) => unknown) | undefined;
  let returnValue: unknown;

  const spy = (...args: ReadonlyArray<unknown>): unknown => {
    calls.push(args);
    try {
      const value = implementation === undefined ? returnValue : implementation(...args);
      results.push({ type: "return", value });
      return value;
    } catch (error) {
      results.push({ type: "throw", value: error });
      throw error;
    }
  };

  return Object.assign(spy, {
    mock: {
      get calls(): ReadonlyArray<ReadonlyArray<unknown>> {
        return calls;
      },
      get results(): ReadonlyArray<SpyResult> {
        return results;
      },
    },
    mockReturnValue(value: unknown): Spy {
      returnValue = value;
      implementation = undefined;
      return spy as Spy;
    },
    mockImplementation(fn: (...args: ReadonlyArray<unknown>) => unknown): Spy {
      implementation = fn;
      return spy as Spy;
    },
    mockReset(): void {
      calls = [];
      results = [];
      implementation = undefined;
      returnValue = undefined;
    },
  }) as Spy;
}
