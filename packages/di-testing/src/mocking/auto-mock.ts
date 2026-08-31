/** The lazy `Proxy` that mocks an erased interface one accessed property at a time. */

import { getOrInsertComputed } from "@codefast/di/core/map-upsert";

import type { MockFactory, MockFn } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";

/**
 * A mocked view of `Dependency`: every method becomes a spy, nested objects are mocked in turn.
 *
 * @remarks With the default backend a method is a precisely-typed {@link Spy}; a custom backend
 * (`vi.fn`, `jest.fn`, a Sinon stub) intersects its own native surface with the method's signature,
 * so backend-specific APIs like `mockReturnValueOnce` or `returns` type-check without adapters.
 *
 * @typeParam Backend - The spy type the active mock factory produces.
 */
export type Mocked<Dependency, Backend extends MockFn = Spy> = Dependency extends (...args: infer Args) => infer Return
  ? Backend extends Spy
    ? Spy<Args, Return>
    : Backend & ((...args: Args) => Return)
  : Dependency extends object
    ? { [Key in keyof Dependency]: Mocked<Dependency[Key], Backend> }
    : Dependency;

/**
 * A recursively optional view of `Dependency` — the shape a hand-written `.impl` stub may supply.
 *
 * @remarks Functions are kept whole (a stub replaces a whole method), everything else is made
 * optional so only the members a test cares about need spelling out.
 */
export type DeepPartial<Dependency> = Dependency extends (...args: ReadonlyArray<unknown>) => unknown
  ? Dependency
  : Dependency extends object
    ? { [Key in keyof Dependency]?: DeepPartial<Dependency[Key]> }
    : Dependency;

/**
 * The key an auto-mock answers with its reset routine, clearing the root spy and every cached member.
 */
export const MOCK_RESET: unique symbol = Symbol("di-testing:mock-reset");

// `then` would make every mock thenable and stall `await`; `toJSON` and `asymmetricMatch` are probed
// by serializers and expect() and must not answer as callables.
const UNMOCKED_KEYS: ReadonlySet<string> = new Set(["then", "toJSON", "asymmetricMatch"]);

/** Clears one spy through whichever reset method its backend spells. */
function resetSpy(spy: unknown): void {
  const candidate = spy as { mockReset?: () => void; reset?: () => void; resetHistory?: () => void };
  if (typeof candidate.mockReset === "function") {
    candidate.mockReset();
  } else if (typeof candidate.reset === "function") {
    candidate.reset();
  } else if (typeof candidate.resetHistory === "function") {
    candidate.resetHistory();
  }
}

/**
 * Builds a lazy auto-mock for an erased interface: each accessed property becomes a cached spy.
 *
 * @remarks The proxy target is itself a spy, so a function-typed dependency records calls and exposes
 * real mock state. A `seed` wins over every other rule, inherited members included; keys the root spy
 * already carries (its own API, `Function.prototype`, a property written onto the mock) pass through
 * rather than minting a stray spy.
 *
 * @typeParam Backend - The spy type the factory produces, threaded into the returned `Mocked` view.
 */
export function createAutoMock<Dependency, Backend extends MockFn = Spy>(
  mockFactory: MockFactory<Backend>,
  seed?: DeepPartial<Dependency>,
): Mocked<Dependency, Backend> {
  const cache = new Map<string, MockFn>();
  const seedRecord = seed as Record<PropertyKey, unknown> | undefined;
  const target = mockFactory();

  const proxy = new Proxy(target, {
    get(fnTarget, key, receiver): unknown {
      if (key === MOCK_RESET) {
        return (): void => {
          resetSpy(fnTarget);
          for (const spy of cache.values()) {
            resetSpy(spy);
          }
        };
      }
      if (seedRecord !== undefined && Reflect.has(seedRecord, key)) {
        return Reflect.get(seedRecord, key);
      }
      if (typeof key === "symbol" || UNMOCKED_KEYS.has(key) || Reflect.has(fnTarget, key)) {
        return Reflect.get(fnTarget, key, receiver);
      }
      return getOrInsertComputed(cache, key, mockFactory);
    },
    // `in` agrees with `get`: any mockable string key answers true, everything else asks the target.
    has(fnTarget, key): boolean {
      if (seedRecord !== undefined && Reflect.has(seedRecord, key)) {
        return true;
      }
      if (typeof key === "symbol" || UNMOCKED_KEYS.has(key)) {
        return Reflect.has(fnTarget, key);
      }
      return true;
    },
  });

  return proxy as unknown as Mocked<Dependency, Backend>;
}
