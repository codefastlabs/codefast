import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createClientTracker } from "#/client/create-client-tracker";
import { defineEventCatalog } from "#/core/event-catalog";
import { createMemoryQueueStorage, createRecordingDestination } from "#/tests/unit/client/support/fakes";

const catalog = defineEventCatalog({
  button_clicked: { owner: "client", schema: z.object({ id: z.string() }) },
  order_completed: { owner: "server", schema: z.object({ orderId: z.string() }) },
});

describe("createClientTracker", () => {
  it("validates props against the catalog schema before enqueueing", () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    expect(() => tracker.track("button_clicked", { id: 42 } as never)).toThrow(/invalid_type|expected string/i);
  });

  it("flushes a valid client-owned event to every destination", async () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "cta" });
    await tracker.flush();

    expect(destination.received).toMatchObject([{ name: "button_clicked", props: { id: "cta" }, type: "track" }]);
  });

  it("rejects a server-owned event at runtime even if the type filter is bypassed", () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    expect(() => tracker.track("order_completed" as never, { orderId: "o1" } as never)).toThrow(
      /Unknown client-owned event/,
    );
  });

  it("stamps the current user onto events after identify", async () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    tracker.identify("user-1", { plan: "pro" });
    tracker.track("button_clicked", { id: "cta" });
    await tracker.flush();

    expect(destination.received.map((event) => event.userId)).toEqual(["user-1", "user-1"]);
  });

  it("enqueues a page envelope carrying the given name and props", async () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    tracker.page("/pricing", { referrer: "/home" });
    await tracker.flush();

    expect(destination.received).toMatchObject([{ name: "/pricing", props: { referrer: "/home" }, type: "page" }]);
  });

  it("enqueues a group envelope carrying the groupId and traits", async () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    tracker.group("acme", { plan: "enterprise" });
    await tracker.flush();

    expect(destination.received).toMatchObject([{ groupId: "acme", traits: { plan: "enterprise" }, type: "group" }]);
  });

  it("delivers to immediate destinations at track time, without waiting for a flush", () => {
    const immediate = { ...createRecordingDestination("immediate"), delivery: "immediate" as const };
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [immediate],
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "cta" });

    expect(immediate.received).toHaveLength(1);
  });

  it("never re-delivers to an immediate destination on flush", async () => {
    const immediate = { ...createRecordingDestination("immediate"), delivery: "immediate" as const };
    const queued = createRecordingDestination("queued");
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [immediate, queued],
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "cta" });
    await tracker.flush();
    await tracker.flush();

    expect(immediate.received).toHaveLength(1);
    expect(queued.received).toHaveLength(1);
  });

  it("keeps tracking working when an immediate destination throws synchronously", () => {
    const throwing = {
      delivery: "immediate" as const,
      name: "broken",
      send: () => {
        throw new Error("boom");
      },
    };
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [throwing],
      storage: createMemoryQueueStorage(),
    });

    expect(() => tracker.track("button_clicked", { id: "cta" })).not.toThrow();
  });

  it("clear() drops pending events without sending them", async () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "cta" });
    tracker.clear();
    await tracker.flush();

    expect(destination.received).toHaveLength(0);
  });

  it("flushWithBeacon sends the pending queue via navigator.sendBeacon", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });

    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [],
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "cta" });
    tracker.flushWithBeacon("/api/events");

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [endpoint, body] = sendBeacon.mock.calls[0] as [string, string];

    expect(endpoint).toBe("/api/events");
    expect(JSON.parse(body)).toMatchObject([{ name: "button_clicked" }]);

    vi.unstubAllGlobals();
  });

  it("drops every event while isTrackingAllowed returns false — nothing sent, nothing queued", async () => {
    const immediate = { ...createRecordingDestination("immediate"), delivery: "immediate" as const };
    const queued = createRecordingDestination("queued");
    const storage = createMemoryQueueStorage();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [immediate, queued],
      isTrackingAllowed: () => false,
      storage,
    });

    tracker.track("button_clicked", { id: "cta" });
    tracker.page("/pricing");
    tracker.group("acme");
    await tracker.flush();

    expect(immediate.received).toHaveLength(0);
    expect(queued.received).toHaveLength(0);
    expect(storage.load()).toHaveLength(0);
  });

  it("re-evaluates the consent gate per event, so a mid-session grant applies immediately", async () => {
    let allowed = false;
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      isTrackingAllowed: () => allowed,
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "before" });
    allowed = true;
    tracker.track("button_clicked", { id: "after" });
    await tracker.flush();

    expect(destination.received).toMatchObject([{ props: { id: "after" } }]);
  });

  it("never invokes an anonymousId resolver for a gated event — no id side effect before consent", async () => {
    const resolveAnonymousId = vi.fn(() => "anon-lazy");
    let allowed = false;
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: resolveAnonymousId,
      catalog,
      destinations: [destination],
      isTrackingAllowed: () => allowed,
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "blocked" });

    expect(resolveAnonymousId).not.toHaveBeenCalled();

    allowed = true;
    tracker.track("button_clicked", { id: "sent" });
    await tracker.flush();

    expect(resolveAnonymousId).toHaveBeenCalledOnce();
    expect(destination.received.map((event) => event.anonymousId)).toEqual(["anon-lazy"]);
  });

  it("keeps consent-exempt immediate destinations fed while gated — identifier-free, unqueued, counts only", async () => {
    const exempt = {
      ...createRecordingDestination("exempt"),
      consent: "exempt" as const,
      delivery: "immediate" as const,
    };
    const required = { ...createRecordingDestination("required"), delivery: "immediate" as const };
    const queued = createRecordingDestination("queued");
    const resolveAnonymousId = vi.fn(() => "anon-lazy");
    const storage = createMemoryQueueStorage();
    const tracker = createClientTracker({
      anonymousId: resolveAnonymousId,
      catalog,
      destinations: [exempt, queued, required],
      isTrackingAllowed: () => false,
      storage,
    });

    tracker.identify("user-1");
    tracker.track("button_clicked", { id: "cta" });
    tracker.page("/pricing");
    await tracker.flush();

    expect(required.received).toHaveLength(0);
    expect(queued.received).toHaveLength(0);
    expect(storage.load()).toHaveLength(0);
    expect(resolveAnonymousId).not.toHaveBeenCalled();
    // only the behavioral kinds flow, and they carry no identity — not even the identify's userId
    expect(exempt.received.map((event) => event.type)).toEqual(["track", "page"]);
    expect(exempt.received.every((event) => event.anonymousId === "" && event.userId === undefined)).toBe(true);
  });

  it("restores full identified delivery to exempt destinations once tracking is allowed", () => {
    const exempt = {
      ...createRecordingDestination("exempt"),
      consent: "exempt" as const,
      delivery: "immediate" as const,
    };
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [exempt],
      isTrackingAllowed: () => true,
    });

    tracker.track("button_clicked", { id: "cta" });

    expect(exempt.received).toMatchObject([{ anonymousId: "anon-1", type: "track" }]);
  });

  it("never routes gated events to an exempt queued destination — the exempt lane is immediate-only", async () => {
    const exemptQueued = { ...createRecordingDestination("exempt-queued"), consent: "exempt" as const };
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [exemptQueued],
      isTrackingAllowed: () => false,
    });

    tracker.track("button_clicked", { id: "cta" });
    await tracker.flush();

    expect(exemptQueued.received).toHaveLength(0);
  });

  it("works without a storage — the queue stays in memory only", async () => {
    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
    });

    tracker.track("button_clicked", { id: "cta" });
    await tracker.flush();

    expect(destination.received).toHaveLength(1);
  });

  it("re-queues events when sendBeacon fails to accept the payload", async () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn().mockReturnValue(false) });

    const destination = createRecordingDestination();
    const tracker = createClientTracker({
      anonymousId: "anon-1",
      catalog,
      destinations: [destination],
      storage: createMemoryQueueStorage(),
    });

    tracker.track("button_clicked", { id: "cta" });
    tracker.flushWithBeacon("/api/events");
    vi.unstubAllGlobals();

    await tracker.flush();
    expect(destination.received).toHaveLength(1);
  });
});
