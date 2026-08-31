import { describe, expect, it, vi } from "vitest";

import { createAutoMock } from "#/mocking/auto-mock";
import { defaultMockFactory } from "#/mocking/mock-factory";

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
    const mock = createAutoMock<Service>(() => vi.fn());
    mock.find("u1");

    expect(mock.find).toHaveBeenCalledWith("u1");
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
});
