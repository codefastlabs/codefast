/**
 * Boot-time warm-up, and the proof that it happened.
 *
 * @remarks An async singleton cannot be resolved synchronously until something has awaited it. That
 * is what `initializeAsync()` is for, and it is also how the claim is checked here: the same sync
 * resolve is run against a warmed container and a cold one, and both outcomes are reported.
 */
import type { Container } from "@codefast/di";
import { DiError, token } from "@codefast/di";

export interface PricingConfig {
  readonly revision: string;
  readonly surchargePercent: number;
}

export const pricingConfigToken = token<PricingConfig>("PricingConfig");

export interface BootReport {
  readonly revision: string;
  readonly surchargePercent: number;
  /** A sync resolve of the async singleton, on the container that was warmed at boot. */
  readonly warmSyncResolve: string;
  /** The same sync resolve on a container nobody warmed — the error `initializeAsync` prevents. */
  readonly coldSyncResolve: string;
}

/** Registers the remote pricing config as an async singleton, exactly as a real fetch would be. */
export function bindPricingConfig(container: Container): void {
  container
    .bind(pricingConfigToken)
    .toDynamicAsync(async () => {
      // Stands in for a config service call; the point is that it cannot answer synchronously.
      await Promise.resolve();

      return { revision: "pricing-2026.08", surchargePercent: 0.4 };
    })
    .singleton();
}

const syncResolveOutcome = (container: Container): string => {
  try {
    return `ok · ${container.resolve(pricingConfigToken).revision}`;
  } catch (caught) {
    return caught instanceof DiError ? caught.constructor.name : String(caught);
  }
};

/**
 * Warms the container and reports both sides of the comparison.
 *
 * @remarks The cold container is built here rather than reused so the contrast cannot be faked by
 * ordering: it has the identical binding and simply never had `initializeAsync()` called on it.
 */
export async function warmAndReport(container: Container, cold: Container): Promise<BootReport> {
  await container.initializeAsync();

  const config = container.resolve(pricingConfigToken);

  return {
    revision: config.revision,
    surchargePercent: config.surchargePercent,
    warmSyncResolve: syncResolveOutcome(container),
    coldSyncResolve: syncResolveOutcome(cold),
  };
}
