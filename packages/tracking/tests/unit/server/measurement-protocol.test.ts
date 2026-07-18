import { describe, expect, it, vi } from "vitest";

import {
  extractGaClientId,
  sendMeasurementProtocolEvents,
  toMeasurementProtocolConsent,
} from "#/server/measurement-protocol";

describe("extractGaClientId", () => {
  it("strips the GA1.<version>. prefix to the client id", () => {
    expect(extractGaClientId("GA1.1.1809596761.1693829043")).toBe("1809596761.1693829043");
    // The version segment varies with the number of domain components.
    expect(extractGaClientId("GA1.2.1809596761.1693829043")).toBe("1809596761.1693829043");
  });

  it("returns undefined for a missing or unparseable cookie rather than a malformed id", () => {
    expect(extractGaClientId(undefined)).toBeUndefined();
    expect(extractGaClientId("")).toBeUndefined();
    expect(extractGaClientId("GA1.1.only-three")).toBeUndefined();
    expect(extractGaClientId("_ga=nope")).toBeUndefined();
  });
});

describe("toMeasurementProtocolConsent", () => {
  it("maps ads to both ad-consent signals", () => {
    expect(toMeasurementProtocolConsent({ ads: true, analytics: true })).toEqual({
      ad_personalization: "GRANTED",
      ad_user_data: "GRANTED",
    });
    expect(toMeasurementProtocolConsent({ ads: false, analytics: true })).toEqual({
      ad_personalization: "DENIED",
      ad_user_data: "DENIED",
    });
  });
});

describe("sendMeasurementProtocolEvents", () => {
  it("posts the client_id, events, and consent to the credentialed collect URL", async () => {
    const transport = vi.fn((_request: { body: string; url: string }) => Promise.resolve());

    await sendMeasurementProtocolEvents({
      apiSecret: "secret/1",
      clientId: "111.222",
      consent: { ad_personalization: "DENIED", ad_user_data: "DENIED" },
      events: [{ name: "consent_update", params: { policy_version: "1" } }],
      measurementId: "G-ABC123",
      transport,
    });

    const request = transport.mock.calls[0]?.[0];

    expect(request?.url).toBe(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-ABC123&api_secret=secret%2F1",
    );
    expect(JSON.parse(request?.body ?? "{}")).toEqual({
      client_id: "111.222",
      consent: { ad_personalization: "DENIED", ad_user_data: "DENIED" },
      events: [{ name: "consent_update", params: { policy_version: "1" } }],
    });
  });

  it("omits the consent object when none is supplied and honors an EU endpoint origin", async () => {
    const transport = vi.fn((_request: { body: string; url: string }) => Promise.resolve());

    await sendMeasurementProtocolEvents({
      apiSecret: "s",
      clientId: "1.2",
      endpointOrigin: "https://region1.google-analytics.com",
      events: [{ name: "consent_update" }],
      measurementId: "G-1",
      transport,
    });

    const request = transport.mock.calls[0]?.[0];

    expect(request?.url.startsWith("https://region1.google-analytics.com/mp/collect")).toBe(true);
    expect(JSON.parse(request?.body ?? "{}")).not.toHaveProperty("consent");
  });
});
