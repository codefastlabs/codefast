import { describe, expect, it } from "vitest";

import { deriveEventId, generateEventId } from "#/core/event-id";

describe("generateEventId", () => {
  it("returns a well-formed, unique UUID on every call", () => {
    const first = generateEventId();
    const second = generateEventId();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(first).not.toBe(second);
  });
});

describe("deriveEventId", () => {
  it("returns the same id for the same requestId and discriminant, every time", () => {
    const first = deriveEventId("req-1", "track:order_completed");
    const second = deriveEventId("req-1", "track:order_completed");

    expect(first).toBe(second);
  });

  it("returns a well-formed 16-character hex id", () => {
    expect(deriveEventId("req-1", "track:order_completed")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("differs across requestIds for the same discriminant", () => {
    const first = deriveEventId("req-1", "track:order_completed");
    const second = deriveEventId("req-2", "track:order_completed");

    expect(first).not.toBe(second);
  });

  it("differs across discriminants for the same requestId", () => {
    const first = deriveEventId("req-1", "track:order_completed");
    const second = deriveEventId("req-1", "group:acme");

    expect(first).not.toBe(second);
  });
});
