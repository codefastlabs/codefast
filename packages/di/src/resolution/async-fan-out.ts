/** Settles the concurrent dependencies of one async level and reports a failure in declaration order. */

/**
 * Applies `apply` to every dependency's settled value, or rejects with the first failure in declaration order.
 *
 * @remarks Siblings start concurrently, and `Promise.all` alone would report whichever rejection
 * settles first — a fact about microtask depth, not about the graph. The synchronous lanes report
 * the first failing dependency in declaration order, so this does too: the happy path is `Promise.all`,
 * and only a failure waits for every sibling to settle and then picks the earliest one that did not.
 *
 * @since 0.11.0
 */
export function settleInOrder<Result>(
  pending: ReadonlyArray<unknown>,
  apply: (values: Array<unknown>) => Result,
): Promise<Result> {
  return Promise.all(pending).then(apply, () => firstRejectionInOrder(pending));
}

function firstRejectionInOrder(pending: ReadonlyArray<unknown>): Promise<never> {
  return Promise.allSettled(pending).then((results) => {
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index]!;
      if (result.status === "rejected") {
        throw result.reason;
      }
    }
    // Unreachable: this branch only runs once `Promise.all` has rejected, so a rejection is settled.
    throw new Error("settleInOrder: a rejected fan-out settled with no rejection");
  });
}
