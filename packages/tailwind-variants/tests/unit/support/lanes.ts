/** Calls one resolver makes before every lane has answered: cold first, then the compiled plan, then its store. */
const CALLS_PER_RESOLVER = 5;

/**
 * Reads one fresh resolver once per call until every lane has answered, in call order.
 *
 * @remarks A fresh resolver answers its first call from the configuration, compiles on the second
 * (with slots) or third (without), and answers a repeat from its store, so five calls reach all three.
 */
export const readEveryLane = <Resolver>(
  createResolver: () => Resolver,
  read: (resolver: Resolver) => unknown,
): ReadonlyArray<unknown> => {
  const resolver = createResolver();
  const answers: Array<unknown> = [];

  for (let call = 0; call < CALLS_PER_RESOLVER; call++) {
    answers.push(read(resolver));
  }

  return answers;
};

/** The answers `readEveryLane` returns when every lane agrees on `expected`. */
export const everyLane = (expected: unknown): ReadonlyArray<unknown> => {
  return Array.from({ length: CALLS_PER_RESOLVER }, () => expected);
};
