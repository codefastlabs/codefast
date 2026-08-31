/** The lazy `Proxy` that mocks an erased interface one accessed property at a time. */

import type { MockFactory, MockFunction } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";

/**
 * A mocked view of `Dependency`: every member becomes a spy, nested objects are mocked in turn.
 *
 * @remarks With the default backend a method is a precisely-typed {@link Spy}; a custom backend
 * (`vi.fn`, `jest.fn`, a Sinon stub) intersects its own native surface with the method's signature,
 * so backend-specific APIs like `mockReturnValueOnce` or `returns` type-check without adapters. The
 * check is mutual, so a backend that merely resembles {@link Spy} still keeps its own surface.
 *
 * @typeParam Dependency - The dependency type being mocked.
 * @typeParam Backend - The spy type the active mock factory produces.
 */
export type Mocked<Dependency, Backend extends MockFunction = Spy> = Dependency extends (
  ...args: infer Args
) => infer Return
  ? [Backend] extends [Spy]
    ? [Spy] extends [Backend]
      ? Spy<Args, Return>
      : Backend & ((...args: Args) => Return)
    : Backend & ((...args: Args) => Return)
  : Dependency extends object
    ? { [Key in keyof Dependency]: Mocked<Dependency[Key], Backend> }
    : Dependency;

/**
 * A recursively optional view of `Dependency` — the shape a hand-written `.stub` seed may supply.
 *
 * @remarks Functions are kept whole (a stub replaces a whole method), everything else is made
 * optional so only the members a test cares about need spelling out.
 *
 * @typeParam Dependency - The dependency type being partially stubbed.
 */
export type DeepPartial<Dependency> = Dependency extends (...args: Array<never>) => unknown
  ? Dependency
  : Dependency extends object
    ? { [Key in keyof Dependency]?: DeepPartial<Dependency[Key]> }
    : Dependency;

/**
 * The key an auto-mock answers with its reset routine, clearing the root spy, every materialized
 * member, and the spies of its seed.
 */
export const MOCK_RESET: unique symbol = Symbol("di-testing:mock-reset");

// `then` would make every mock thenable and stall `await`; `toJSON` and `asymmetricMatch` are probed
// by serializers and expect() and must not answer as callables.
const UNMOCKED_KEYS: ReadonlySet<string> = new Set(["then", "toJSON", "asymmetricMatch"]);

// Inherited members that inspection and printing rely on; every other inherited key (`apply`,
// `call`, `bind`, the throwing `caller`/`arguments`) is fair game for a domain interface.
const INHERITED_PASSTHROUGH: ReadonlySet<string> = new Set([
  "constructor",
  "toString",
  "toLocaleString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
]);

/** Clears one spy through whichever reset method its backend spells, recursing into auto-mocks. */
function resetSpy(spy: unknown): void {
  if (spy === null || (typeof spy !== "object" && typeof spy !== "function")) {
    return;
  }
  const candidate = spy as {
    [MOCK_RESET]?: () => void;
    mockReset?: () => void;
    reset?: () => void;
    resetHistory?: () => void;
  };
  if (typeof candidate[MOCK_RESET] === "function") {
    candidate[MOCK_RESET]();
  } else if (typeof candidate.mockReset === "function") {
    candidate.mockReset();
  } else if (typeof candidate.reset === "function") {
    candidate.reset();
  } else if (typeof candidate.resetHistory === "function") {
    candidate.resetHistory();
  }
}

/** Whether the seed supplies `key` itself — its prototype chain counts, the global prototypes don't. */
function seedProvides(seed: object, key: PropertyKey): boolean {
  let current: object | null = seed;
  while (current !== null && current !== Object.prototype && current !== Function.prototype) {
    if (Object.hasOwn(current, key)) {
      return true;
    }
    current = Object.getPrototypeOf(current);
  }
  return false;
}

/**
 * Builds a lazy auto-mock for an erased interface: each accessed member becomes a cached child mock.
 *
 * @remarks The proxy target is itself a spy, so a function-typed dependency records calls, and every
 * materialized member is another auto-mock, so nested access (`repo.user.create`) works to any depth.
 * A `seed` wins for the members it supplies (inherited ones included; a primitive seed is returned
 * as the value itself); keys the root spy owns pass through, so its backend API stays real — which
 * also means a member sharing a name with a function's own `name`/`length` cannot be auto-mocked.
 *
 * @typeParam Dependency - The dependency type being mocked.
 * @typeParam Backend - The spy type the factory produces, threaded into the returned `Mocked` view.
 */
export function createAutoMock<Dependency, Backend extends MockFunction = Spy>(
  mockFactory: MockFactory<Backend>,
  seed?: DeepPartial<Dependency>,
): Mocked<Dependency, Backend> {
  // A primitive stub has no members to mock — the seed is the dependency's whole value.
  if (seed !== undefined && (typeof seed !== "object" || seed === null) && typeof seed !== "function") {
    return seed as Mocked<Dependency, Backend>;
  }

  const cache = new Map<string, unknown>();
  const methodWrappers = new Map<string, unknown>();
  const seedRecord = seed as Record<PropertyKey, unknown> | undefined;
  const target = mockFactory();
  let self: unknown;

  const reset = (): void => {
    resetSpy(target);
    for (const child of cache.values()) {
      resetSpy(child);
    }
    if (seedRecord !== undefined) {
      for (const value of Object.values(seedRecord)) {
        resetSpy(value);
      }
    }
  };

  const proxy = new Proxy(target, {
    get(fnTarget, key, receiver): unknown {
      if (key === MOCK_RESET) {
        return reset;
      }
      if (seedRecord !== undefined && seedProvides(seedRecord, key)) {
        // A non-configurable, non-writable target property must report its own value (proxy invariant).
        const own = Reflect.getOwnPropertyDescriptor(fnTarget, key);
        if (own !== undefined && own.configurable === false && own.writable === false) {
          return own.value;
        }
        return Reflect.get(seedRecord, key);
      }
      if (typeof key === "symbol" || UNMOCKED_KEYS.has(key)) {
        return Reflect.get(fnTarget, key, receiver);
      }
      if (Object.hasOwn(fnTarget, key)) {
        const value = Reflect.get(fnTarget, key);
        if (typeof value !== "function") {
          return value;
        }
        // The backend's own methods run against the target, and a chainable return re-enters the mock.
        let wrapper = methodWrappers.get(key);
        if (wrapper === undefined) {
          wrapper = (...args: ReadonlyArray<unknown>): unknown => {
            const result = (value as (...call: ReadonlyArray<unknown>) => unknown).call(fnTarget, ...args);
            return result === fnTarget ? self : result;
          };
          methodWrappers.set(key, wrapper);
        }
        return wrapper;
      }
      if (INHERITED_PASSTHROUGH.has(key)) {
        return Reflect.get(fnTarget, key);
      }
      let child = cache.get(key);
      if (child === undefined) {
        child = createAutoMock(mockFactory);
        cache.set(key, child);
      }
      return child;
    },
    // `in` agrees with `get`: any mockable string key answers true, everything else asks the target.
    has(fnTarget, key): boolean {
      if (key === MOCK_RESET) {
        return true;
      }
      if (seedRecord !== undefined && seedProvides(seedRecord, key)) {
        return true;
      }
      if (typeof key === "symbol" || UNMOCKED_KEYS.has(key)) {
        return Reflect.has(fnTarget, key);
      }
      return true;
    },
    // Enumeration shows the interface's materialized members, not the spy backend's internals.
    ownKeys(fnTarget): Array<string | symbol> {
      const keys = new Set<string | symbol>();
      if (seedRecord !== undefined) {
        for (const key of Reflect.ownKeys(seedRecord)) {
          keys.add(key);
        }
      }
      for (const key of cache.keys()) {
        keys.add(key);
      }
      // Non-configurable target keys must be reported (proxy invariant); the rest stay hidden.
      for (const key of Reflect.ownKeys(fnTarget)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(fnTarget, key);
        if (descriptor !== undefined && descriptor.configurable === false) {
          keys.add(key);
        }
      }
      return [...keys];
    },
    getOwnPropertyDescriptor(fnTarget, key): PropertyDescriptor | undefined {
      if (typeof key === "string" && (cache.has(key) || (seedRecord !== undefined && seedProvides(seedRecord, key)))) {
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: (proxy as Record<string, unknown>)[key],
        };
      }
      return Reflect.getOwnPropertyDescriptor(fnTarget, key);
    },
    deleteProperty(fnTarget, key): boolean {
      if (typeof key === "string" && cache.delete(key)) {
        return true;
      }
      return Reflect.deleteProperty(fnTarget, key);
    },
  });

  self = proxy;

  return proxy as unknown as Mocked<Dependency, Backend>;
}
