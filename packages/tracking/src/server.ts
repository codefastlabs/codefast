export type { AnonymousIdSetCookieOptions } from "#/server/anonymous-id-cookie";
export {
  buildAnonymousIdSetCookie,
  buildClearAnonymousIdSetCookie,
  isValidAnonymousId,
} from "#/server/anonymous-id-cookie";

export type { BuildConsentReceiptOptions } from "#/server/consent-receipt";
export { buildConsentReceipt, coarsenIp, RECEIPT_SCHEMA_VERSION } from "#/server/consent-receipt";

export type { ReceiptStore, ReceiptStoreBackend } from "#/server/consent-receipt-store";
export { createDurableReceiptStore, createInMemoryReceiptStore } from "#/server/consent-receipt-store";

export type { InitialConsent, InitialConsentOptions } from "#/server/initial-consent";
export { resolveInitialConsent } from "#/server/initial-consent";

export type {
  MeasurementProtocolConsent,
  MeasurementProtocolEvent,
  MeasurementProtocolTransport,
  SendMeasurementProtocolEventsOptions,
} from "#/server/measurement-protocol";
export {
  extractGaClientId,
  sendMeasurementProtocolEvents,
  toMeasurementProtocolConsent,
} from "#/server/measurement-protocol";

export {
  EU_COUNTRY_CODES,
  OPT_IN_EQUIVALENT_COUNTRY_CODES,
  resolveRegion,
  resolveRegionFromCountryCode,
} from "#/server/region";

export type {
  Ga4UserDeletionRequest,
  Ga4UserDeletionTransport,
  SubmitGa4UserDeletionOptions,
} from "#/server/user-deletion";
export { buildGa4UserDeletionRequest, submitGa4UserDeletion } from "#/server/user-deletion";
