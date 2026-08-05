/** The tenant context and the requests derived from it, shared by the console and the container. */

export const REGIONS = ["eu", "us", "apac"] as const;
export const TIERS = ["free", "pro", "enterprise"] as const;

export type Region = (typeof REGIONS)[number];
export type Tier = (typeof TIERS)[number];

/** What one request carries; every slot decision is taken against this. */
export interface TenantContext {
  readonly tenant: string;
  readonly region: Region;
  readonly tier: Tier;
}

export type SlotTags = ReadonlyArray<readonly [string, unknown]>;

/** The request that selects a tenant's storage adapter. */
export function storageRequest(context: TenantContext): { tags: SlotTags } {
  return { tags: [["region", context.region]] };
}

/**
 * The request that selects a tenant's payment gateway.
 *
 * @remarks An enterprise tenant names both tags, which is what lets the specialisation win; every
 * other tier names only the region, so free and pro ask an identical question.
 */
export function paymentRequest(context: TenantContext): { tags: SlotTags } {
  return context.tier === "enterprise"
    ? {
        tags: [
          ["region", context.region],
          ["tier", "enterprise"],
        ],
      }
    : { tags: [["region", context.region]] };
}

/** What each slot will be asked for a given tenant, so the console can show cause before effect. */
export function plannedRequests(context: TenantContext): Array<{ token: string; asks: string }> {
  const render = (tags: SlotTags): string => tags.map(([key, value]) => `${key}: ${String(value)}`).join(", ");

  return [
    { token: "Storage", asks: `{ ${render(storageRequest(context).tags)} }` },
    { token: "PaymentGateway", asks: `{ ${render(paymentRequest(context).tags)} }` },
    { token: "Notifier", asks: "{ name: transactional }" },
    { token: "AuditLogger", asks: "no criterion" },
  ];
}
