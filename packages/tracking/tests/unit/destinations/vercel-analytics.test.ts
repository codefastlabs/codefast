import { beforeEach, describe, expect, it, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@vercel/analytics", () => ({ track }));

describe("createVercelAnalyticsDestination", () => {
  beforeEach(() => {
    track.mockClear();
  });

  it("forwards the event name and allowed-type properties to Vercel's track()", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      properties: { count: 3, id: "cta", primary: true, url: null },
      timestamp: 0,
      type: "track",
    });

    expect(track).toHaveBeenCalledWith("button_clicked", { count: 3, id: "cta", primary: true, url: null });
  });

  it("stringifies properties that Vercel's track() can't accept (nested objects/arrays)", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "order_completed",
      properties: { items: ["a", "b"] },
      timestamp: 0,
      type: "track",
    });

    expect(track).toHaveBeenCalledWith("order_completed", { items: '["a","b"]' });
  });

  it("drops undefined properties instead of forwarding them", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");
    const destination = createVercelAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "page_viewed",
      properties: { referrer: undefined },
      timestamp: 0,
      type: "track",
    });

    expect(track).toHaveBeenCalledWith("page_viewed", {});
  });

  it("uses the given destination name", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");

    expect(createVercelAnalyticsDestination({ name: "va" }).name).toBe("va");
  });

  it("defaults to requiring consent, with exempt as an explicit opt-in", async () => {
    const { createVercelAnalyticsDestination } = await import("#/destinations/vercel-analytics");

    expect(createVercelAnalyticsDestination().consentRequirement).toBe("required");
    expect(createVercelAnalyticsDestination({ consentRequirement: "exempt" }).consentRequirement).toBe("exempt");
  });
});
