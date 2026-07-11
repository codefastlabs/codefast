import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createClientTracker } from "#/client/create-client-tracker";
import { defineEventCatalog } from "#/core/event-catalog";
import { createRecordingDestination } from "#/tests/unit/client/support/fakes";

const catalog = defineEventCatalog({
  button_clicked: { schema: z.object({ id: z.string() }) },
  order_completed: { schema: z.object({ orderId: z.string() }) },
});

describe("createClientTracker", () => {
  it("builds a full envelope and fans it out to every destination", () => {
    const first = createRecordingDestination("first");
    const second = createRecordingDestination("second");
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog,
      destinations: [first, second],
    });

    tracker.track("button_clicked", { id: "cta" });

    expect(first.received).toHaveLength(1);
    expect(second.received).toHaveLength(1);
    expect(first.received[0]).toMatchObject({
      anonymousId: "anon-1",
      name: "button_clicked",
      properties: { id: "cta" },
      type: "track",
    });
    expect(first.received[0]?.eventId).toBeTruthy();
    expect(first.received[0]?.timestamp).toBeTypeOf("number");
  });

  it("validates properties against the catalog schema and throws on mismatch", () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog,
      destinations: [destination],
    });

    expect(() => {
      tracker.track("button_clicked", { id: 42 as unknown as string });
    }).toThrow(/Invalid properties/);
    expect(destination.received).toHaveLength(0);
  });

  it("throws on an event name missing from the catalog", () => {
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog,
      destinations: [],
    });

    expect(() => {
      tracker.track("unknown_event" as "button_clicked", { id: "x" });
    }).toThrow(/Unknown event/);
  });

  it("drops events entirely while the gate is closed and no destination is exempt", () => {
    const destination = createRecordingDestination();
    const anonymousId = vi.fn(() => "anon-1");
    const tracker = createClientTracker({
      anonymousId,
      catalog,
      destinations: [destination],
      isAnalyticsAllowed: () => false,
    });

    tracker.track("button_clicked", { id: "cta" });

    expect(destination.received).toHaveLength(0);
    // No anonymousId may be resolved for a gated event — resolving could mint a cookie.
    expect(anonymousId).not.toHaveBeenCalled();
  });

  it("keeps exempt destinations receiving identifier-free events while gated", () => {
    const exempt = createRecordingDestination("exempt");

    exempt.consentRequirement = "exempt";

    const required = createRecordingDestination("required");
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog,
      destinations: [exempt, required],
      isAnalyticsAllowed: () => false,
    });

    tracker.track("button_clicked", { id: "cta" });

    expect(required.received).toHaveLength(0);
    expect(exempt.received).toHaveLength(1);
    expect(exempt.received[0]?.anonymousId).toBe("");
  });

  it("re-reads the gate per event so a mid-session grant applies immediately", () => {
    const destination = createRecordingDestination();
    let isAllowed = false;
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog,
      destinations: [destination],
      isAnalyticsAllowed: () => isAllowed,
    });

    tracker.track("button_clicked", { id: "before" });
    isAllowed = true;
    tracker.track("button_clicked", { id: "after" });

    expect(destination.received).toHaveLength(1);
    expect(destination.received[0]?.properties).toEqual({ id: "after" });
  });

  it("never lets a throwing destination break the tracked interaction", () => {
    const throwing = {
      name: "throwing",
      send: () => {
        throw new Error("sync throw");
      },
    };
    const recording = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog,
      // a sync-throwing destination violates the async contract on purpose
      destinations: [throwing as never, recording],
    });

    expect(() => {
      tracker.track("button_clicked", { id: "cta" });
    }).not.toThrow();
    expect(recording.received).toHaveLength(1);
  });
});
