import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { Destination } from "#/core/destination";
import { defineEventCatalog } from "#/core/event-catalog";
import type { TrackedEvent } from "#/core/tracked-event";
import { createTrackedEventIngestHandler, relayTrackedEvents } from "#/server/relay";

const catalog = defineEventCatalog({
  copy_code: { owner: "client", schema: z.object({ name: z.string() }) },
  server_only: { owner: "server", schema: z.object({}) },
});

function clientTrackEvent(overrides: Partial<TrackedEvent> = {}): TrackedEvent {
  return {
    anonymousId: "11111111-1111-4111-8111-111111111111",
    eventId: "e-1",
    name: "copy_code",
    owner: "client",
    properties: { name: "button" },
    timestamp: 1_700_000_000_000,
    type: "track",
    ...overrides,
  } as TrackedEvent;
}

function captureDestination(): { destination: Destination; sent: Array<TrackedEvent> } {
  const sent: Array<TrackedEvent> = [];

  return {
    destination: {
      name: "capture",
      async send(event) {
        sent.push(event);
      },
    },
    sent,
  };
}

describe("relayTrackedEvents", () => {
  it("delivers valid client envelopes and keeps the client-minted eventId", async () => {
    const { destination, sent } = captureDestination();
    const result = await relayTrackedEvents([clientTrackEvent()], { catalog, destinations: [destination] });

    expect(result).toEqual({ accepted: 1, rejected: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.eventId).toBe("e-1");
  });

  it("re-stamps identity from the server-read context over client claims", async () => {
    const { destination, sent } = captureDestination();

    await relayTrackedEvents([clientTrackEvent()], {
      catalog,
      context: { anonymousId: "22222222-2222-4222-8222-222222222222", userId: "user-1" },
      destinations: [destination],
    });

    expect(sent[0]?.anonymousId).toBe("22222222-2222-4222-8222-222222222222");
    expect(sent[0]?.userId).toBe("user-1");
  });

  it("rejects non-envelopes, server-owned envelopes, unknown events, and schema mismatches", async () => {
    const { destination, sent } = captureDestination();
    const result = await relayTrackedEvents(
      [
        "garbage",
        clientTrackEvent({ owner: "server" } as Partial<TrackedEvent>),
        clientTrackEvent({ name: "server_only" } as Partial<TrackedEvent>),
        clientTrackEvent({ name: "unknown_event" } as Partial<TrackedEvent>),
        clientTrackEvent({ properties: { name: 42 } } as Partial<TrackedEvent>),
        clientTrackEvent(),
      ],
      { catalog, destinations: [destination] },
    );

    expect(result).toEqual({ accepted: 1, rejected: 5 });
    expect(sent).toHaveLength(1);
  });

  it("counts envelopes past maxBatchSize as rejected instead of silently truncating", async () => {
    const { destination } = captureDestination();
    const result = await relayTrackedEvents([clientTrackEvent(), clientTrackEvent(), clientTrackEvent()], {
      catalog,
      destinations: [destination],
      maxBatchSize: 2,
    });

    expect(result).toEqual({ accepted: 2, rejected: 1 });
  });

  it("applies the per-event gate after the identity re-stamp", async () => {
    const { destination, sent } = captureDestination();
    const isAllowed = vi.fn((event: TrackedEvent) => event.userId === undefined);

    const result = await relayTrackedEvents([clientTrackEvent()], {
      catalog,
      context: { userId: "user-1" },
      destinations: [destination],
      isAllowed,
    });

    expect(result).toEqual({ accepted: 0, rejected: 1 });
    expect(sent).toHaveLength(0);
  });

  it("hands delivery to waitUntil instead of awaiting it", async () => {
    let resolveSend: (() => void) | undefined;
    const destination: Destination = {
      name: "slow",
      send: () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        }),
    };
    const scheduled: Array<Promise<void>> = [];

    const result = await relayTrackedEvents([clientTrackEvent()], {
      catalog,
      destinations: [destination],
      waitUntil: (work) => {
        scheduled.push(work);
      },
    });

    // relay resolved while the destination is still in flight
    expect(result).toEqual({ accepted: 1, rejected: 0 });
    expect(scheduled).toHaveLength(1);

    resolveSend?.();
    await scheduled[0];
  });
});

describe("createTrackedEventIngestHandler", () => {
  const handler = createTrackedEventIngestHandler({ catalog, destinations: [] });

  it("answers 405 to non-POST", async () => {
    const response = await handler(new Request("https://app.test/ingest", { method: "GET" }));

    expect(response.status).toBe(405);
  });

  it("answers 400 to non-JSON and non-array payloads", async () => {
    const bad = await handler(new Request("https://app.test/ingest", { body: "not json", method: "POST" }));
    const notArray = await handler(new Request("https://app.test/ingest", { body: "{}", method: "POST" }));

    expect(bad.status).toBe(400);
    expect(notArray.status).toBe(400);
  });

  it("answers 413 past the body cap", async () => {
    const capped = createTrackedEventIngestHandler({ catalog, destinations: [], maxBodyBytes: 10 });
    const response = await capped(
      new Request("https://app.test/ingest", { body: JSON.stringify([clientTrackEvent()]), method: "POST" }),
    );

    expect(response.status).toBe(413);
  });

  it("relays a valid batch and reports counts, resolving context from the request", async () => {
    const { destination, sent } = captureDestination();
    const withContext = createTrackedEventIngestHandler({
      catalog,
      context: () => ({ userId: "from-request" }),
      destinations: [destination],
    });

    const response = await withContext(
      new Request("https://app.test/ingest", { body: JSON.stringify([clientTrackEvent()]), method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accepted: 1, rejected: 0 });
    expect(sent[0]?.userId).toBe("from-request");
  });
});
