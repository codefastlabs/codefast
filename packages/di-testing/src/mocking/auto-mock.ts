/** The lazy `Proxy` that mocks an erased interface one accessed property at a time. */

import type { MockFactory } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";

/**
 * A mocked view of `T`: every method becomes a {@link Spy}, nested objects are mocked in turn.
 *
 * @typeParam T - The dependency type being mocked.
 */
export type Mocked<T> = T extends (...args: infer Args) => infer Return
  ? Spy<Args, Return>
  : T extends object
    ? { [Key in keyof T]: Mocked<T[Key]> }
    : T;

/**
 * A recursively optional view of `T` — the shape a hand-written `.impl` stub may supply.
 *
 * @remarks Functions are kept whole (a stub replaces a whole method), everything else is made
 * optional so only the members a test cares about need spelling out.
 *
 * @typeParam T - The dependency type being partially stubbed.
 */
export type DeepPartial<T> = T extends (...args: ReadonlyArray<unknown>) => unknown
  ? T
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

/**
 * Builds a lazy auto-mock for an erased interface: each accessed property becomes a cached spy.
 *
 * @remarks A `then` access and every symbol key return the raw target untouched — so the mock is
 * never mistaken for a thenable (which would stall an `await`) and inspection or iteration does not
 * spawn stray spies. A `seed` supplies concrete members that take precedence over the lazy spies.
 *
 * @typeParam T - The dependency type being mocked.
 */
export function createAutoMock<T>(mockFactory: MockFactory, seed?: DeepPartial<T>): Mocked<T> {
  const cache = new Map<PropertyKey, unknown>();
  const seedRecord = seed as Record<PropertyKey, unknown> | undefined;
  const target = (): void => {};

  const proxy = new Proxy(target, {
    get(fnTarget, key, receiver): unknown {
      if (key === "then" || typeof key === "symbol") {
        return Reflect.get(fnTarget, key, receiver);
      }
      if (seedRecord !== undefined && Object.hasOwn(seedRecord, key)) {
        return seedRecord[key];
      }
      let spy = cache.get(key);
      if (spy === undefined) {
        spy = mockFactory();
        cache.set(key, spy);
      }
      return spy;
    },
  });

  return proxy as unknown as Mocked<T>;
}
