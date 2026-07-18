import { describe, expect, it, vi } from "vitest";

import { createMicrosoftUetDestination, toMicrosoftUetConsent } from "#/destinations/microsoft-uet";

const event = {
  anonymousId: "anon-1",
  eventId: "e1",
  name: "purchase",
  properties: { note: null, value: 9 },
  timestamp: 0,
  type: "track",
} as const;

describe("toMicrosoftUetConsent", () => {
  it("drives the enforced ad_storage signal from ads", () => {
    expect(toMicrosoftUetConsent({ ads: true, analytics: true })).toEqual({ ad_storage: "granted" });
    expect(toMicrosoftUetConsent({ ads: false, analytics: true })).toEqual({ ad_storage: "denied" });
  });
});

describe("createMicrosoftUetDestination", () => {
  it("maps the event and the live ads decision into the transport payload", async () => {
    const transport = vi.fn();
    const destination = createMicrosoftUetDestination({
      getDecision: () => ({ ads: false, analytics: true }),
      transport,
    });

    await destination.send(event);

    expect(transport).toHaveBeenCalledWith({
      consent: { ad_storage: "denied" },
      name: "purchase",
      properties: { value: 9 },
    });
  });

  it("onErasure clears cookies and stops sending, without a deletion-API call (DSR-V4)", async () => {
    const transport = vi.fn();
    const clearCookies = vi.fn();
    const destination = createMicrosoftUetDestination({
      clearCookies,
      getDecision: () => ({ ads: true, analytics: true }),
      transport,
    });

    await destination.onErasure?.("subject-1");
    await destination.send(event);

    expect(clearCookies).toHaveBeenCalledOnce();
    expect(transport).not.toHaveBeenCalled();
  });
});
