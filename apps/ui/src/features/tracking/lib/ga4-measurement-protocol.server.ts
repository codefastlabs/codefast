import type { ConsentReceiptInput } from "@codefast/tracking/core/consent-receipt";
import {
  extractGaClientId,
  sendMeasurementProtocolEvents,
  toMeasurementProtocolConsent,
} from "@codefast/tracking/server/measurement-protocol";
import { getCookie } from "@tanstack/react-start/server";

/**
 * Forwards a recorded consent decision to GA4 as a server-owned `consent_update` event via
 * the Measurement Protocol — the server-side counterpart to the client tag, and the one
 * server-owned event this app tracks. Heavily gated: only when analytics consent is present
 * (never after a withdrawal — the visitor just denied GA4), the MP credentials are
 * configured, and the visitor already carries a GA4 client id. Server-only: the `.server`
 * suffix keeps the API secret and the connection-cookie read off the client graph.
 */
export async function forwardConsentDecisionToGa4(input: ConsentReceiptInput): Promise<void> {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  // No credentials, or the visitor denied analytics → nothing to send to GA4.
  if (!measurementId || !apiSecret || !input.decision.analytics) {
    return;
  }

  const clientId = extractGaClientId(getCookie("_ga"));

  // No GA4 client id yet (gtag never ran, or was blocked) → nothing to correlate against.
  if (!clientId) {
    return;
  }

  await sendMeasurementProtocolEvents({
    apiSecret,
    clientId,
    consent: toMeasurementProtocolConsent(input.decision),
    events: [
      {
        name: "consent_update",
        params: {
          consent_method: input.method,
          consent_type: input.eventType,
          policy_version: input.policyVersion,
        },
      },
    ],
    measurementId,
  });
}
