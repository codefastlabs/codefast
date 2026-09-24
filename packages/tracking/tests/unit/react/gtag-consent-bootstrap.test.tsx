import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GtagConsentBootstrap } from "#react/gtag-consent-bootstrap";

describe("GtagConsentBootstrap", () => {
  it("renders an inline script whose source matches the consent bootstrap builder", () => {
    const container = document.createElement("div");

    // Server-rendered as it ships: React never runs a script it creates on the client, and warns about one.
    container.innerHTML = renderToString(
      <GtagConsentBootstrap
        config={{ policyVersion: "1", requestedCategories: ["analytics"], storageKey: "k" }}
        defaultConsent={{ ads: false, analytics: true }}
        gaMeasurementId="G-TEST"
        nonce="csp-1"
      />,
    );

    const script = container.querySelector("script");

    expect(script).not.toBeNull();
    expect(script?.nonce).toBe("csp-1");
    expect(script?.innerHTML).toContain("G-TEST");
    expect(script?.innerHTML).toContain("consent");
    expect(script?.innerHTML).toContain("csp-1");
  });
});
