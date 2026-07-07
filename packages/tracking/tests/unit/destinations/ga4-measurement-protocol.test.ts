import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createGa4MeasurementProtocolDestination } from "#/destinations/ga4-measurement-protocol";

describe("createGa4MeasurementProtocolDestination", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts client_id, event name, and flat params to the collect endpoint", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "order_completed",
      owner: "server",
      props: { total: 42, currency: "USD" },
      timestamp: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=secret");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      client_id: "anon-1",
      events: [{ name: "order_completed", params: { total: 42, currency: "USD" } }],
    });
  });

  it("includes user_id only when the event carries one", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "signed_up",
      owner: "server",
      props: {},
      timestamp: 0,
      userId: "user-1",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(init.body as string)).toEqual({
      client_id: "anon-1",
      events: [{ name: "signed_up", params: {} }],
      user_id: "user-1",
    });
  });

  it("stringifies params the Measurement Protocol can't accept (nested objects/arrays)", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "order_completed",
      owner: "server",
      props: { items: ["a", "b"] },
      timestamp: 0,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(init.body as string)).toEqual({
      client_id: "anon-1",
      events: [{ name: "order_completed", params: { items: '["a","b"]' } }],
    });
  });

  it("drops undefined and null props instead of forwarding them", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e4",
      name: "page_viewed",
      owner: "server",
      props: { referrer: undefined, url: null },
      timestamp: 0,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(init.body as string)).toEqual({
      client_id: "anon-1",
      events: [{ name: "page_viewed", params: {} }],
    });
  });

  it("routes to the debug endpoint when debug is enabled", async () => {
    const destination = createGa4MeasurementProtocolDestination({
      apiSecret: "secret",
      debug: true,
      measurementId: "G-TEST123",
    });

    await destination.send({
      anonymousId: "anon-1",
      eventId: "e5",
      name: "order_completed",
      owner: "server",
      props: {},
      timestamp: 0,
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
        eventId: "e6",
        name: "order_completed",
        owner: "server",
        props: {},
        timestamp: 0,
      }),
    ).rejects.toThrow('"ga4-measurement-protocol" destination responded with 500');
  });
});
