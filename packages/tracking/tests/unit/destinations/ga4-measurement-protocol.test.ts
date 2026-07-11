import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createGa4MeasurementProtocolDestination,
  extractGa4ClientId,
  extractGa4SessionId,
} from "#/destinations/ga4-measurement-protocol";

describe("createGa4MeasurementProtocolDestination", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts client_id, event name, flat params, and timestamp to the collect endpoint", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "order_completed",
      owner: "server",
      properties: { total: 42, currency: "USD" },
      timestamp: 1_700_000_000_000,
      type: "track",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=secret");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      client_id: "anon-1",
      events: [{ name: "order_completed", params: { total: 42, currency: "USD", engagement_time_msec: 100 } }],
      timestamp_micros: 1_700_000_000_000_000,
    });
  });

  it("warns and skips the fetch when a track name would be rejected by GA4", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "invalid-name",
      owner: "server",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("prefers the gtag client_id over the tracker's anonymous ID when provided", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      clientId: "123.456",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "order_completed",
      owner: "server",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(init.body as string)).toMatchObject({ client_id: "123.456" });
  });

  it("attaches session_id to params when configured, without clobbering a caller-set one", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
      sessionId: "1700000000",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "order_completed",
      owner: "server",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { events: Array<{ params: Record<string, unknown> }> };

    expect(body.events[0]?.params.session_id).toBe("1700000000");
  });

  it("includes user_id only when the event carries one", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e4",
      name: "signed_up",
      owner: "server",
      properties: {},
      timestamp: 0,
      type: "track",
      userId: "user-1",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(init.body as string)).toMatchObject({ user_id: "user-1" });
  });

  it("stringifies params the Measurement Protocol can't accept (nested objects/arrays)", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e5",
      name: "order_completed",
      owner: "server",
      properties: { items: ["a", "b"] },
      timestamp: 0,
      type: "track",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { events: Array<{ params: Record<string, unknown> }> };

    expect(body.events[0]?.params.items).toBe('["a","b"]');
  });

  it("maps group to GA4's join_group with group_id and drops alias entirely", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e6",
      owner: "server",
      previousId: "anon-0",
      timestamp: 0,
      type: "alias",
      userId: "user-1",
    });

    // GA4 has no alias concept — identity merges happen via user_id.
    expect(fetchMock).not.toHaveBeenCalled();

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e7",
      groupId: "acme",
      owner: "server",
      timestamp: 0,
      traits: { plan: "enterprise" },
      type: "group",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      events: Array<{ name: string; params: Record<string, unknown> }>;
    };

    expect(body.events[0]?.name).toBe("join_group");
    expect(body.events[0]?.params).toMatchObject({ group_id: "acme", plan: "enterprise" });
  });

  it("routes to the debug endpoint when debug is enabled", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      debugMode: true,
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e8",
      name: "order_completed",
      owner: "server",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://www.google-analytics.com/debug/mp/collect?measurement_id=G-TEST123&api_secret=secret");
  });

  it("uses the given destination name", () => {
    expect(createGa4MeasurementProtocolDestination({ apiSecret: "s", measurementId: "G-1", name: "ga4-mp" }).name).toBe(
      "ga4-mp",
    );
  });

  it("defaults the destination name to ga4-measurement-protocol", () => {
    expect(createGa4MeasurementProtocolDestination({ apiSecret: "s", measurementId: "G-1" }).name).toBe(
      "ga4-measurement-protocol",
    );
  });

  it("throws when the endpoint responds with a non-ok status, so the caller's retry path fires", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await expect(
      destination.send({
        anonymousId: "anon-1",
        eventId: "e9",
        name: "order_completed",
        owner: "server",
        properties: {},
        timestamp: 0,
        type: "track",
      }),
    ).rejects.toThrow('"ga4-measurement-protocol" destination responded with 500');
  });
});

describe("extractGa4ClientId", () => {
  it("reads the last two segments of the _ga cookie", () => {
    expect(extractGa4ClientId("_ga=GA1.1.123456789.987654321; other=x")).toBe("123456789.987654321");
  });

  it("returns undefined when the cookie is absent or malformed", () => {
    expect(extractGa4ClientId(undefined)).toBeUndefined();
    expect(extractGa4ClientId("other=x")).toBeUndefined();
    expect(extractGa4ClientId("_ga=bogus")).toBeUndefined();
  });
});

describe("extractGa4SessionId", () => {
  it("reads the session ID from a GS1-format per-stream cookie", () => {
    expect(extractGa4SessionId("_ga_TEST123=GS1.1.1700000000.5.1.1700000123.60.0.0", "G-TEST123")).toBe("1700000000");
  });

  it("reads the session ID from a GS2-format per-stream cookie", () => {
    expect(extractGa4SessionId("_ga_TEST123=GS2.1.s1700000000$o5$g1$t1700000123$j60$l0$h0", "G-TEST123")).toBe(
      "1700000000",
    );
  });

  it("returns undefined when the per-stream cookie is absent", () => {
    expect(extractGa4SessionId("_ga=GA1.1.1.2", "G-TEST123")).toBeUndefined();
    expect(extractGa4SessionId(undefined, "G-TEST123")).toBeUndefined();
  });
});
