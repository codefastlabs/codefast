/** The tenant context and the requests derived from it, shared by the console and the container. */
import type { BindingTag } from "@codefast/di";
// The subpath, not the barrel: this module is client-reachable, so only the tag module should
// follow it into the console's chunk.
import { tag } from "@codefast/di/core/tag";

export const REGIONS = ["eu", "us", "apac"] as const;
export const TIERS = ["free", "pro", "enterprise"] as const;

export type Region = (typeof REGIONS)[number];
export type Tier = (typeof TIERS)[number];

/**
 * The tag keys every slot decision is taken against.
 *
 * @remarks Declared once and shared, so the bind site and the request site cannot drift: the value
 * type is checked at both ends, and a criterion is the same interned object on either side.
 */
export const REGION_TAG = tag<Region>("region");
export const TIER_TAG = tag<Tier>("tier");

/** What one request carries; every slot decision is taken against this. */
export interface TenantContext {
  readonly tenant: string;
  readonly region: Region;
  readonly tier: Tier;
}

/** The tags one slot carries — `BindingTag` is the container's own pair, not a copy of its shape. */
export type SlotTags = ReadonlyArray<BindingTag>;

/** The request that selects a tenant's storage adapter. */
export function storageRequest(context: TenantContext): { tags: SlotTags } {
  return { tags: [REGION_TAG.of(context.region)] };
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
        tags: [REGION_TAG.of(context.region), TIER_TAG.of("enterprise")],
      }
    : { tags: [REGION_TAG.of(context.region)] };
}

/** What each slot will be asked for a given tenant, so the console can show cause before effect. */
export function plannedRequests(context: TenantContext): Array<{ token: string; asks: string }> {
  const render = (tags: SlotTags): string =>
    tags.map((criterion) => `${criterion.key.name}: ${String(criterion.value)}`).join(", ");

  return [
    { token: "Storage", asks: `{ ${render(storageRequest(context).tags)} }` },
    { token: "PaymentGateway", asks: `{ ${render(paymentRequest(context).tags)} }` },
    { token: "Notifier", asks: "{ name: transactional }" },
    { token: "AuditLogger", asks: "no criterion" },
  ];
}
