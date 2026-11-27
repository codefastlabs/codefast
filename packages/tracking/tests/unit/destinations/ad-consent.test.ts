import { describe, expect, it, vi } from "vitest";
import * as z from "zod";

import { createClientTracker } from "#client/create-client-tracker";
import { defineEventCatalog } from "#core/event-catalog";
import { toAdConsentState } from "#destinations/ad-consent";
import { createMetaDestination } from "#destinations/meta";
import { createMicrosoftUetDestination } from "#destinations/microsoft-uet";
import { createTiktokDestination } from "#destinations/tiktok";

describe("toAdConsentState", () => {
  it("transmits only on an ads grant by default, with LDU following !ads", () => {
    expect(toAdConsentState({ ads: true, analytics: true })).toEqual({
      limitedDataUse: false,
      transmissionAllowed: true,
    });
    expect(toAdConsentState({ ads: false, analytics: true })).toEqual({
      limitedDataUse: true,
      transmissionAllowed: false,
    });
    expect(toAdConsentState({ ads: true, analytics: false })).toEqual({
      limitedDataUse: false,
      transmissionAllowed: true,
    });
    expect(toAdConsentState({ ads: false, analytics: false })).toEqual({
      limitedDataUse: true,
      transmissionAllowed: false,
    });
  });

  it("lets analytics carry an LDU delivery where Limited Data Use substitutes for ads", () => {
    const options = { isLimitedDataUseAllowed: true };

    expect(toAdConsentState({ ads: false, analytics: true }, options)).toEqual({
      limitedDataUse: true,
      transmissionAllowed: true,
    });
    expect(toAdConsentState({ ads: false, analytics: false }, options)).toEqual({
      limitedDataUse: true,
      transmissionAllowed: false,
    });
  });
});

describe.each([
  ["meta", createMetaDestination],
  ["tiktok", createTiktokDestination],
  ["microsoft-uet", createMicrosoftUetDestination],
] as const)("%s destination permission", (_name, createDestination) => {
  const analyticsOnly = { ads: false, analytics: true };

  it("is withheld when ads is denied — the opt-in default", () => {
    const destination = createDestination({ transport: () => undefined });

    expect(destination.isPermittedBy?.(analyticsOnly)).toBe(false);
    expect(destination.isPermittedBy?.({ ads: true, analytics: false })).toBe(true);
  });

  it("re-reads the LDU allowance per event so a resolved opt-out mode lets analytics carry it", () => {
    let isLimitedDataUseAllowed = false;
    const destination = createDestination({
      isLimitedDataUseAllowed: () => isLimitedDataUseAllowed,
      transport: () => undefined,
    });

    expect(destination.isPermittedBy?.(analyticsOnly)).toBe(false);

    isLimitedDataUseAllowed = true;

    expect(destination.isPermittedBy?.(analyticsOnly)).toBe(true);
    expect(destination.isPermittedBy?.({ ads: false, analytics: false })).toBe(false);
  });
});

describe("ad destinations behind a tracker", () => {
  it("restrict to LDU from the gate's own consent, so GPC over a stored ads grant still sends restricted", () => {
    const transport = vi.fn();
    const tracker = createClientTracker({
      anonymousId: () => "anon-1",
      catalog: defineEventCatalog({ purchase: { schema: z.object({ value: z.number() }) } }),
      destinations: [createMetaDestination({ isLimitedDataUseAllowed: () => true, transport })],
      getConsent: () => ({ ads: false, analytics: true }),
    });

    tracker.track("purchase", { value: 9 });

    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({ dataProcessingOptions: { country: 0, options: ["LDU"], state: 0 } }),
    );
  });
});
