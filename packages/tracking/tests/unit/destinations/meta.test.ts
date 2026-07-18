import { describe, expect, it, vi } from "vitest";

import { createMetaDestination, toMetaDataProcessingOptions } from "#/destinations/meta";

describe("toMetaDataProcessingOptions", () => {
  it("enables geolocated LDU when ads is denied", () => {
    expect(toMetaDataProcessingOptions({ ads: false, analytics: true })).toEqual({
      country: 0,
      options: ["LDU"],
      state: 0,
    });
  });

  it("applies no restriction when ads is granted", () => {
    expect(toMetaDataProcessingOptions({ ads: true, analytics: true })).toEqual({
      country: 0,
      options: [],
      state: 0,
    });
  });
});

describe("createMetaDestination", () => {
  const event = {
    anonymousId: "anon-1",
    eventId: "e1",
    name: "purchase",
    properties: { note: null, value: 9 },
    timestamp: 0,
    type: "track",
  } as const;

  it("maps the event and the live ads decision into the transport payload", async () => {
    const transport = vi.fn();
    const destination = createMetaDestination({ getDecision: () => ({ ads: true, analytics: true }), transport });

    await destination.send(event);

    expect(transport).toHaveBeenCalledWith({
      dataProcessingOptions: { country: 0, options: [], state: 0 },
      name: "purchase",
      // null is dropped by the default flatten (Meta params take scalars only).
      properties: { value: 9 },
    });
  });

  it("re-reads the decision per event so an ads withdrawal flips to LDU without recreating it", async () => {
    const transport = vi.fn();
    let decision = { ads: true, analytics: true };
    const destination = createMetaDestination({ getDecision: () => decision, transport });

    await destination.send(event);
    decision = { ads: false, analytics: true };
    await destination.send(event);

    expect(transport.mock.calls[0]?.[0].dataProcessingOptions.options).toEqual([]);
    expect(transport.mock.calls[1]?.[0].dataProcessingOptions.options).toEqual(["LDU"]);
  });

  it("is consent-required — an ad sink is never exempt", () => {
    const destination = createMetaDestination({
      getDecision: () => ({ ads: true, analytics: true }),
      transport: () => undefined,
    });

    expect(destination.consentRequirement).toBe("required");
  });
});
