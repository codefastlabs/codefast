import { beforeEach, describe, expect, it, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@vercel/analytics/react", () => ({ track }));

describe("createVercelAnalyticsDestination", () => {
  beforeEach(() => {
    track.mockClear();
  });

  it("forwards the event name and allowed-type props to Vercel's track()", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      owner: "client",
      props: { count: 3, id: "cta", primary: true, url: null },
      timestamp: 0,
    });

    expect(track).toHaveBeenCalledWith("button_clicked", { count: 3, id: "cta", primary: true, url: null });
  });

  it("stringifies props that Vercel's track() can't accept (nested objects/arrays)", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "order_completed",
      owner: "client",
      props: { items: ["a", "b"] },
      timestamp: 0,
    });

    expect(track).toHaveBeenCalledWith("order_completed", { items: '["a","b"]' });
  });

  it("drops undefined props instead of forwarding them", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "page_viewed",
      owner: "client",
      props: { referrer: undefined },
      timestamp: 0,
    });

    expect(track).toHaveBeenCalledWith("page_viewed", {});
  });

  it("uses the given destination name", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");

    expect(createVercelAnalyticsDestination("va").name).toBe("va");
  });
});
