import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TrackedEvent } from "#/core/tracked-event";
import { createHttpDestination } from "#/destinations/http";

function buildEvent(name: string): TrackedEvent {
  return {
    anonymousId: "anon-1",
    eventId: name,
    name,
    owner: "client",
    properties: {},
    timestamp: 0,
    type: "track",
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHttpDestination", () => {
  it("POSTs a single event with an abort deadline", async () => {
    const destination = createHttpDestination({ endpoint: "/collect", name: "collector" });

    await destination.send(buildEvent("a"));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("/collect");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(false);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body as string)).toMatchObject({ eventId: "a" });
  });

  it("ships a whole batch as one request and honors keepalive", async () => {
    const destination = createHttpDestination({ endpoint: "/collect", name: "collector" });

    await destination.sendBatch?.([buildEvent("a"), buildEvent("b")], { keepalive: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body as string)).toHaveLength(2);
  });

  it("throws on a non-2xx response so queues can retry", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const destination = createHttpDestination({ endpoint: "/collect", name: "collector" });

    await expect(destination.send(buildEvent("a"))).rejects.toThrow('"collector" destination responded with 500');
  });

  it("aborts a stalled request after requestTimeoutMs", async () => {
    vi.useFakeTimers();

    try {
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => {
              reject(init.signal?.reason as Error);
            });
          }),
      );

      const destination = createHttpDestination({ endpoint: "/collect", name: "collector", requestTimeoutMs: 50 });
      // Attach the handler up front so the timer-driven rejection is never unhandled.
      const outcome = destination.send(buildEvent("a")).then(
        () => "resolved",
        (error: unknown) => error,
      );

      await vi.advanceTimersByTimeAsync(50);
      // jsdom's DOMException is a different realm than Node's — assert on the name, not instanceof.
      await expect(outcome).resolves.toMatchObject({ name: "TimeoutError" });
    } finally {
      vi.useRealTimers();
    }
  });
});
