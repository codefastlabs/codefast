import { describe, expect, it, vi } from "vitest";

import { createTiktokDestination, toTiktokConsent } from "#destinations/tiktok";

const event = {
  anonymousId: "anon-1",
  eventId: "e1",
  name: "purchase",
  properties: { note: null, value: 9 },
  timestamp: 0,
  type: "track",
} as const;

describe("toTiktokConsent", () => {
  it("turns on the single LDU boolean when ads is denied", () => {
    expect(toTiktokConsent({ ads: false, analytics: true })).toEqual({ limited_data_use: true });
    expect(toTiktokConsent({ ads: true, analytics: true })).toEqual({ limited_data_use: false });
  });
});

describe("createTiktokDestination", () => {
  it("maps the event and its consent into the transport payload", async () => {
    const transport = vi.fn();
    const destination = createTiktokDestination({ transport });

    await destination.send(event, { ads: false, analytics: true });

    expect(transport).toHaveBeenCalledWith({
      consent: { limited_data_use: true },
      name: "purchase",
      properties: { value: 9 },
    });
  });

  it("onErasure clears cookies and stops sending, without a deletion-API call (DSR-V4)", async () => {
    const transport = vi.fn();
    const clearCookies = vi.fn();
    const destination = createTiktokDestination({
      clearCookies,
      transport,
    });

    await destination.onErasure?.("subject-1");
    await destination.send(event, { ads: true, analytics: true });

    expect(clearCookies).toHaveBeenCalledOnce();
    expect(transport).not.toHaveBeenCalled();
  });
});
