/** Boot-time warm-up of the async pricing config, and the proof that it happened. */
import type { Container } from "@codefast/di";
import { DiError, token } from "@codefast/di";

interface PricingConfig {
  readonly revision: string;
  readonly surchargePercent: number;
}

const pricingConfigToken = token<PricingConfig>("PricingConfig");

export interface BootReport {
  readonly revision: string;
  readonly surchargePercent: number;
  /** A sync resolve of the async singleton, on the container that was warmed at boot. */
  readonly warmSyncResolve: string;
  /** The same sync resolve on a container nobody warmed — the error `initializeAsync` prevents. */
  readonly coldSyncResolve: string;
  /** False only if one of the two outcomes is not the one the contract requires — then it is a real fault. */
  readonly asExpected: boolean;
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

  const warmSyncResolve = syncResolveOutcome(container);
  const coldSyncResolve = syncResolveOutcome(cold);

  return {
    revision: config.revision,
    surchargePercent: config.surchargePercent,
    warmSyncResolve,
    coldSyncResolve,
    // The cold error is the evidence, not a fault; a fault is either side answering the other way.
    asExpected: warmSyncResolve.startsWith("ok") && coldSyncResolve === "AsyncResolutionError",
  };
}
