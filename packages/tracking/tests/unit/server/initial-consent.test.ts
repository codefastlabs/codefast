import { describe, expect, it } from "vitest";

import { buildInitialConsent } from "#/server/initial-consent";

describe("buildInitialConsent", () => {
  it("resolves an EU visitor to opt-in with analytics denied", () => {
    expect(buildInitialConsent({ requestedCategories: ["analytics"], countryCode: "DE" })).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "eu",
    });
  });

  it("resolves UK/EEA equivalents to the eu opt-in region", () => {
    for (const countryCode of ["GB", "IS", "LI", "NO"]) {
      expect(buildInitialConsent({ requestedCategories: ["analytics"], countryCode })).toMatchObject({
        mode: "opt-in",
        region: "eu",
      });
    }
  });

  it("resolves a US visitor to opt-out with analytics granted", () => {
    expect(buildInitialConsent({ requestedCategories: ["analytics"], countryCode: "US" })).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("forces ads denied when GPC is present on an opt-out default", () => {
    expect(
      buildInitialConsent({
        requestedCategories: ["ads", "analytics"],
        countryCode: "US",
        hasGlobalPrivacyControlSignal: true,
      }),
    ).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("fails closed to the strictest opt-in default for a missing country code (unknown visitor)", () => {
    expect(buildInitialConsent({ requestedCategories: ["analytics"], countryCode: undefined })).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "other",
    });
  });

  it("keeps a known non-EU country on the other / opt-out default — unknown ≠ known-elsewhere", () => {
    expect(buildInitialConsent({ requestedCategories: ["analytics"], countryCode: "JP" })).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "other",
    });
  });
});
