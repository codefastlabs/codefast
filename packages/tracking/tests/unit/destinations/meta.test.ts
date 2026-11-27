import { describe, expect, it, vi } from "vitest";

import { createMetaDestination, toMetaDataProcessingOptions } from "#destinations/meta";

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

  it("maps the event and its consent into the transport payload", async () => {
    const transport = vi.fn();
    const destination = createMetaDestination({ transport });

    await destination.send(event, { ads: true, analytics: true });

    expect(transport).toHaveBeenCalledWith({
      dataProcessingOptions: { country: 0, options: [], state: 0 },
      name: "purchase",
      // null is dropped by the default flatten (Meta params take scalars only).
      properties: { value: 9 },
    });
  });

  it("maps the consent each event was admitted under, so an ads withdrawal flips to LDU", async () => {
    const transport = vi.fn();
    const destination = createMetaDestination({ transport });

    await destination.send(event, { ads: true, analytics: true });
    await destination.send(event, { ads: false, analytics: true });

    expect(transport.mock.calls[0]?.[0].dataProcessingOptions.options).toEqual([]);
    expect(transport.mock.calls[1]?.[0].dataProcessingOptions.options).toEqual(["LDU"]);
  });

  it("restricts to LDU when the tracker has no consent gate", async () => {
    const transport = vi.fn();
    const destination = createMetaDestination({ transport });

    await destination.send(event, undefined);

    expect(transport.mock.calls[0]?.[0].dataProcessingOptions.options).toEqual(["LDU"]);
  });

  it("is consent-required — an ad sink is never exempt", () => {
    const destination = createMetaDestination({
      transport: () => undefined,
    });

    expect(destination.consentRequirement).toBe("required");
  });

  it("onErasure clears cookies and stops sending, without any deletion-API call (DSR-V4)", async () => {
    const transport = vi.fn();
    const clearCookies = vi.fn();
    const destination = createMetaDestination({
      clearCookies,
      transport,
    });

    await destination.onErasure?.("subject-1");

    expect(clearCookies).toHaveBeenCalledOnce();
    // Erasure is cookie-clear + stop-send only — Meta has no per-visitor deletion API.
    expect(transport).not.toHaveBeenCalled();

    await destination.send(event, { ads: true, analytics: true });

    expect(transport).not.toHaveBeenCalled();
  });
});
