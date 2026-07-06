import { describe, expect, it } from "vitest";

import { generateEventId } from "#/core/event-id";

describe("generateEventId", () => {
  it("returns a well-formed, unique UUID on every call", () => {
    const first = generateEventId();
    const second = generateEventId();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(first).not.toBe(second);
  });
});
