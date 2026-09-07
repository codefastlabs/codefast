import type { ConsentReceiptInput } from "@codefast/tracking";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forwardConsentDecisionToGa4 } from "#/features/tracking/lib/ga4-measurement-protocol.server";

const { getCookie, sendMeasurementProtocolEvents } = vi.hoisted(() => ({
  getCookie: vi.fn<(name: string) => string | undefined>(),
  sendMeasurementProtocolEvents: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tanstack/react-start/server", () => ({ getCookie }));
vi.mock(import("@codefast/tracking/server/measurement-protocol"), async (importOriginal) => ({
  ...(await importOriginal()),
  sendMeasurementProtocolEvents,
}));

const GRANT: ConsentReceiptInput = {
  decision: { ads: false, analytics: true },
  eventType: "give",
  method: "granular",
  noticeLanguage: "en",
  noticeVersion: "1",
  policyVersion: "1",
  subjectId: "11111111-1111-1111-1111-111111111111",
  subjectIdType: "cookie",
};

beforeEach(() => {
  vi.stubEnv("VITE_GA4_MEASUREMENT_ID", "G-ABC123");
  vi.stubEnv("GA4_API_SECRET", "secret");
  getCookie.mockReturnValue("GA1.1.111.222");
  sendMeasurementProtocolEvents.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("forwardConsentDecisionToGa4", () => {
  it("forwards a consent_update event with the derived client id and consent signals", async () => {
    await forwardConsentDecisionToGa4(GRANT);

    expect(sendMeasurementProtocolEvents).toHaveBeenCalledOnce();
    expect(sendMeasurementProtocolEvents).toHaveBeenCalledWith({
      apiSecret: "secret",
      clientId: "111.222",
      consent: { ad_personalization: "DENIED", ad_user_data: "DENIED" },
      events: [
        {
          name: "consent_update",
          params: { consent_method: "granular", consent_type: "give", policy_version: "1" },
        },
      ],
      measurementId: "G-ABC123",
    });
  });

  it("does not forward after an analytics withdrawal — the visitor just denied GA4", async () => {
    await forwardConsentDecisionToGa4({ ...GRANT, decision: { ads: false, analytics: false }, eventType: "withdraw" });

    expect(sendMeasurementProtocolEvents).not.toHaveBeenCalled();
  });

  it("does not forward when the API secret is unconfigured", async () => {
    vi.stubEnv("GA4_API_SECRET", "");

    await forwardConsentDecisionToGa4(GRANT);

    expect(sendMeasurementProtocolEvents).not.toHaveBeenCalled();
  });

  it("does not forward when the visitor has no GA4 client id yet", async () => {
    getCookie.mockReturnValue(undefined);

    await forwardConsentDecisionToGa4(GRANT);

    expect(sendMeasurementProtocolEvents).not.toHaveBeenCalled();
  });
});
