/**
 * DSR delegation for GA4 (spec-data-subject-rights §3): the platform ships its own
 * per-visitor deletion, so the system **delegates** rather than reimplementing a deletion
 * store. Targets the current **Analytics Admin API** `properties.submitUserDeletion` — the
 * legacy v3 `userDeletionRequests:upsert` was sunset with Universal Analytics, so the spec's
 * DSR-V3 `{ id: { type: "CLIENT_ID", userId } }` shape is stale; the current request keys the
 * subject with a flat `clientId` (a oneof with `userId`/`appInstanceId`/`userProvidedData`).
 *
 * @see https://developers.google.com/analytics/devguides/config/userdeletion/migration
 */

const ADMIN_API_ORIGIN = "https://analyticsadmin.googleapis.com";

/**
 * @since 1.0.0-canary.7
 */
export interface Ga4UserDeletionRequest {
  body: { clientId: string };
  url: string;
}

/**
 * Builds the Admin API `submitUserDeletion` request that erases one GA4 subject by
 * `clientId` (the `_ga`-cookie id — see `extractGaClientId`). Pure and network-free so the
 * request shape can be snapshotted/verified; pair it with {@link submitGa4UserDeletion} or
 * any authenticated transport.
 *
 * @param options - `propertyId` is the numeric GA4 property (no `properties/` prefix).
 *
 * @since 1.0.0-canary.7
 */
export function buildGa4UserDeletionRequest(options: { clientId: string; propertyId: string }): Ga4UserDeletionRequest {
  return {
    body: { clientId: options.clientId },
    url: `${ADMIN_API_ORIGIN}/v1alpha/properties/${options.propertyId}:submitUserDeletion`,
  };
}

/**
 * The one network primitive the sender needs — injected so the package ships no HTTP client.
 *
 * @since 1.0.0-canary.7
 */
export type Ga4UserDeletionTransport = (request: {
  body: string;
  headers: Record<string, string>;
  url: string;
}) => Promise<void>;

async function defaultTransport(request: {
  body: string;
  headers: Record<string, string>;
  url: string;
}): Promise<void> {
  const response = await fetch(request.url, { body: request.body, headers: request.headers, method: "POST" });

  if (!response.ok) {
    throw new Error(`GA4 user deletion responded ${String(response.status)}`);
  }
}

/**
 * @since 1.0.0-canary.7
 */
export interface SubmitGa4UserDeletionOptions {
  /** A bearer token for the `https://www.googleapis.com/auth/analytics.edit` scope — the caller owns OAuth. */
  accessToken: string;
  clientId: string;
  propertyId: string;
  transport?: Ga4UserDeletionTransport | undefined;
}

/**
 * Submits a GA4 user-deletion request for one `clientId`. Authorization is the caller's:
 * pass a bearer token minted from a service account (never baked into the package). The
 * deletion removes the subject from the Individual User report within ~72h and purges at the
 * next run; it does **not** reach previously-aggregated reports or BigQuery exports
 * (spec-data-subject-rights §3).
 *
 * @since 1.0.0-canary.7
 */
export async function submitGa4UserDeletion(options: SubmitGa4UserDeletionOptions): Promise<void> {
  const request = buildGa4UserDeletionRequest({ clientId: options.clientId, propertyId: options.propertyId });

  await (options.transport ?? defaultTransport)({
    body: JSON.stringify(request.body),
    headers: {
      authorization: `Bearer ${options.accessToken}`,
      "content-type": "application/json",
    },
    url: request.url,
  });
}
