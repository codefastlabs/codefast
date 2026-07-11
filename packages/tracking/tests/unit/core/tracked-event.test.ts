import { describe, expect, it } from "vitest";

import { buildTrackedEvent, isTrackedEvent } from "#/core/tracked-event";

describe("buildTrackedEvent", () => {
  it("rejoins a track seed with base fields without losing the discriminant", () => {
    const event = buildTrackedEvent(
      { name: "button_clicked", properties: { id: "cta" }, type: "track" },
      { anonymousId: "anon-1", eventId: "e1", owner: "client", timestamp: 0 },
    );

    expect(event).toEqual({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      owner: "client",
      properties: { id: "cta" },
      timestamp: 0,
      type: "track",
    });
    expect(isTrackedEvent(event)).toBe(true);
  });
});

describe("isTrackedEvent", () => {
  it("accepts a well-formed track envelope", () => {
    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        name: "button_clicked",
        owner: "client",
        properties: { id: "cta" },
        timestamp: 0,
        type: "track",
      }),
    ).toBe(true);
  });

  it("rejects a track envelope missing name or properties", () => {
    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        timestamp: 0,
        type: "track",
      }),
    ).toBe(false);

    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        name: "button_clicked",
        timestamp: 0,
        type: "track",
      }),
    ).toBe(false);
  });

  it("rejects a group envelope missing groupId or traits", () => {
    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        timestamp: 0,
        traits: {},
        type: "group",
      }),
    ).toBe(false);

    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        groupId: "acme",
        timestamp: 0,
        type: "group",
      }),
    ).toBe(false);
  });

  it("accepts a page envelope with optional name", () => {
    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        properties: {},
        timestamp: 0,
        type: "page",
      }),
    ).toBe(true);
  });

  it("rejects an unknown type even when base fields are present", () => {
    expect(
      isTrackedEvent({
        anonymousId: "anon-1",
        eventId: "e1",
        timestamp: 0,
        type: "custom",
      }),
    ).toBe(false);
  });
});
