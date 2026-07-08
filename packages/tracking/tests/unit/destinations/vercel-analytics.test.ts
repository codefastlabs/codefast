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
      type: "track",
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
      type: "track",
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
      type: "track",
    });

    expect(track).toHaveBeenCalledWith("page_viewed", {});
  });

  it("uses the given destination name", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");

    expect(createVercelAnalyticsDestination({ name: "va" }).name).toBe("va");
  });

  it("drops page envelopes by default — the mounted <Analytics /> component already tracks page views", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e4",
      name: "/pricing",
      owner: "client",
      props: { href: "https://x.test/pricing" },
      timestamp: 0,
      type: "page",
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("forwards page envelopes as page_view with only the caller's extras when trackPageViews is on", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination({ trackPageViews: true });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e5",
      name: "/pricing",
      owner: "client",
      props: { href: "https://x.test/pricing", referrer: "/home" },
      timestamp: 0,
      type: "page",
    });

    expect(track).toHaveBeenCalledWith("page_view", { referrer: "/home" });
  });

  it("drops identify, group, and alias — Vercel Analytics has no identity API to translate them to", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e6",
      owner: "client",
      timestamp: 0,
      traits: { plan: "pro" },
      type: "identify",
    });
    void destination.send({
      anonymousId: "anon-1",
      eventId: "e7",
      groupId: "acme",
      owner: "client",
      timestamp: 0,
      traits: {},
      type: "group",
    });
    void destination.send({
      anonymousId: "anon-1",
      eventId: "e8",
      owner: "client",
      previousId: "anon-0",
      timestamp: 0,
      type: "alias",
      userId: "user-1",
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("defaults to requiring consent, with exempt as an explicit opt-in", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");

    expect(createVercelAnalyticsDestination().consent).toBe("required");
    expect(createVercelAnalyticsDestination({ consent: "exempt" }).consent).toBe("exempt");
  });
});
