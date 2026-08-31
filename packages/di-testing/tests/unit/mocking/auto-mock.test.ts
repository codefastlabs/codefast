import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { createAutoMock, MOCK_RESET } from "#/mocking/auto-mock";
import type { Mocked } from "#/mocking/auto-mock";
import { defaultMockFactory } from "#/mocking/mock-factory";
import { createSpy } from "#/mocking/spy";

interface Service {
  find(id: string): string;
  save(value: string): void;
}

describe("createAutoMock", () => {
  it("materializes a spy per property lazily and caches it", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);

    expect(mock.find).toBe(mock.find);
    expect(mock.find).not.toBe(mock.save);
  });

  it("records calls through the materialized spies", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);
    mock.find("u1");

    expect(mock.find.mock.calls).toEqual([["u1"]]);
  });

  it("uses the supplied factory for every property", () => {
    const mock = createAutoMock<Service, Mock>(() => vi.fn());
    mock.find("u1");

    expect(mock.find).toHaveBeenCalledWith("u1");
  });

  it("resets the root spy and every cached member through MOCK_RESET", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);
    mock.find("u1");
    mock.save("v");

    (mock as unknown as { [MOCK_RESET]: () => void })[MOCK_RESET]();

    expect(mock.find.mock.calls).toEqual([]);
    expect(mock.save.mock.calls).toEqual([]);
  });

  it("resets backends that spell reset their own way", () => {
    type Callable = (...args: ReadonlyArray<unknown>) => unknown;
    const resets: Array<string> = [];
    const sinonish = (): Callable & { reset(): void } =>
      Object.assign(() => undefined, { reset: () => void resets.push("reset") });
    const historyish = (): Callable & { resetHistory(): void } =>
      Object.assign(() => undefined, { resetHistory: () => void resets.push("history") });

    const sinonMock = createAutoMock<Service, Callable & { reset(): void }>(sinonish);
    void sinonMock.find;
    (sinonMock as unknown as { [MOCK_RESET]: () => void })[MOCK_RESET]();

    const historyMock = createAutoMock<Service, Callable & { resetHistory(): void }>(historyish);
    void historyMock.find;
    (historyMock as unknown as { [MOCK_RESET]: () => void })[MOCK_RESET]();

    // Each variant resets its root spy plus the one materialized member.
    expect(resets).toEqual(["reset", "reset", "history", "history"]);

    // A backend with no reset method at all is left alone rather than crashed on.
    const bare = createAutoMock<Service, Callable>(() => () => undefined);
    void bare.find;
    expect(() => (bare as unknown as { [MOCK_RESET]: () => void })[MOCK_RESET]()).not.toThrow();
  });

  it("prefers seeded members over lazy spies", () => {
    const mock = createAutoMock<Service>(defaultMockFactory, {
      find: () => "seeded",
    });

    expect(mock.find("anything")).toBe("seeded");
  });

  it("is never mistaken for a thenable", () => {
    const mock = createAutoMock<Service>(defaultMockFactory) as { then?: unknown };
    expect(mock.then).toBeUndefined();
  });

  it("does not spawn spies for symbol keys", () => {
    const mock = createAutoMock<Service>(defaultMockFactory) as Record<symbol, unknown>;
    expect(mock[Symbol.iterator]).toBeUndefined();
  });

  it("mocks a function-typed dependency as a live spy", () => {
    const mock = createAutoMock<(id: string) => number>(defaultMockFactory);

    mock.mockReturnValue(7);
    expect(mock("u1")).toBe(7);
    expect(mock.mock.calls).toEqual([["u1"]]);
  });

  it("honours a class-instance seed whose methods live on the prototype", () => {
    class FakeService {
      find(id: string): string {
        return `real:${id}`;
      }
      save(_value: string): void {}
    }
    const mock = createAutoMock<Service>(defaultMockFactory, new FakeService());

    expect(mock.find("u1")).toBe("real:u1");
  });

  it("lets a seed supply then and symbol-keyed members", () => {
    const iterate = (): Iterator<number> => [1, 2][Symbol.iterator]();
    const mock = createAutoMock<Iterable<number>>(defaultMockFactory, {
      [Symbol.iterator]: iterate,
    } as never);

    expect([...mock]).toEqual([1, 2]);
  });

  it("returns a property written onto the mock instead of a spy", () => {
    const mock = createAutoMock<Service & { host?: string }>(defaultMockFactory);
    mock.host = "localhost";

    expect(mock.host).toBe("localhost");
  });

  it("does not mint spies for serializer probes", () => {
    const mock = createAutoMock<Service>(defaultMockFactory) as unknown as Record<string, unknown>;

    expect(mock["toJSON"]).toBeUndefined();
    expect(mock["asymmetricMatch"]).toBeUndefined();
    expect(typeof mock["name"]).toBe("string");
    expect(typeof mock["hasOwnProperty"]).toBe("function");
  });

  it("answers `in` consistently with property access", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);

    expect("find" in mock).toBe(true);
    expect("then" in mock).toBe(false);
  });

  it("answers `in` for the reset key", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);

    expect(MOCK_RESET in mock).toBe(true);
  });

  it("answers `in` for seeded members", () => {
    const mock = createAutoMock<Service>(defaultMockFactory, { find: () => "seeded" });

    expect("find" in mock).toBe(true);
  });

  it("survives a point-free backend factory", () => {
    // The cache upsert must call the factory with no arguments — vi.fn("name") would install the
    // property name as the mock's implementation.
    const mock = createAutoMock<Service, Mock>(vi.fn);

    expect(mock.find("u1")).toBeUndefined();
    expect(mock.find).toHaveBeenCalledWith("u1");
  });

  it("mocks nested members to any depth", () => {
    interface Repo {
      user: { create(name: string): string };
    }
    const mock = createAutoMock<Repo>(defaultMockFactory);

    mock.user.create("alice");

    expect(mock.user.create.mock.calls).toEqual([["alice"]]);
    expect(mock.user.create).toBe(mock.user.create);
  });

  it("auto-mocks members that shadow Function.prototype", () => {
    interface Discount {
      apply(order: string): number;
    }
    const mock = createAutoMock<Discount>(defaultMockFactory);

    mock.apply("order-1");

    expect(mock.apply.mock.calls).toEqual([["order-1"]]);
  });

  it("returns a primitive seed as the dependency's whole value", () => {
    expect(createAutoMock<string>(defaultMockFactory, "https://x")).toBe("https://x");
    expect(createAutoMock<number>(defaultMockFactory, 0)).toBe(0);
  });

  it("keeps a non-configurable target property over a colliding seed key", () => {
    // vi.fn defines `mock` as non-configurable; a proxy returning a different value would violate
    // the proxy invariant and throw.
    const mock = createAutoMock<{ mock: string }, Mock>(() => vi.fn(), { mock: "seeded" });

    expect(mock.mock).not.toBe("seeded");
  });

  it("re-enters the proxy when a chainable backend method returns the target", () => {
    const mock = createAutoMock<(id: string) => number>(defaultMockFactory);
    const chained = mock.mockReturnValue(7);

    expect(chained).toBe(mock);
    expect(mock("u1")).toBe(7);
  });

  it("resets seeded spies through MOCK_RESET", () => {
    const seeded = createSpy().mockReturnValue("u");
    // The primitive seed member exercises the reset walk's non-spy guard.
    const mock = createAutoMock<Service & { label: string }>(defaultMockFactory, { find: seeded, label: "x" });
    mock.find("u1");

    (mock as unknown as { [MOCK_RESET]: () => void })[MOCK_RESET]();

    expect(seeded.mock.calls).toEqual([]);
    expect(seeded("x")).toBeUndefined();
  });

  it("enumerates materialized members instead of backend internals", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);
    void mock.find;

    expect(Object.keys(mock)).toEqual(["find"]);
    expect(Object.hasOwn(mock, "find")).toBe(true);
  });

  it("enumerates seed keys and invariant-pinned target keys", () => {
    const seeded = createAutoMock<Service, Mock>(() => vi.fn(), { find: () => "seeded" });
    // vi.fn's non-configurable `mock` must be reported (proxy invariant); the seed key joins it.
    expect(Object.keys(seeded)).toEqual(expect.arrayContaining(["find", "mock"]));
  });

  it("forwards delete of a never-materialized key to the target", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);

    expect(() => delete (mock as Partial<Mocked<Service>>).find).not.toThrow();
  });

  it("re-mints a member after delete", () => {
    const mock = createAutoMock<Service>(defaultMockFactory);
    mock.find("u1");

    delete (mock as Partial<Mocked<Service>>).find;

    expect(mock.find.mock.calls).toEqual([]);
  });
});
