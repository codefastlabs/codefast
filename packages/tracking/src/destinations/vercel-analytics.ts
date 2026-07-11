import { track } from "@vercel/analytics";

import type { Destination } from "#/core/destination";
import { flattenEventProps } from "#/destinations/shared";

export interface VercelAnalyticsDestinationOptions {
  /**
   * Vercel Analytics is cookieless and its events carry no identifier from this
   * package, so it qualifies for `"exempt"` — it then keeps receiving events while the
   * tracker's analytics gate is closed. Defaults to `"required"` so pre-consent delivery
   * stays an explicit opt-in.
   */
  consentRequirement?: "exempt" | "required" | undefined;
  name?: string | undefined;
}

/**
 * `track()` only pushes onto Vercel's own in-page queue (`window.va`/`window.vaq`), which
 * handles batching and unload delivery itself. Requires the Vercel Analytics script to be
 * loaded once elsewhere in the app (`<Analytics />` from `@vercel/analytics/react`, or the
 * framework-agnostic `inject()`) — this destination only queues events, so it imports the
 * base `@vercel/analytics` package and has no React dependency of its own.
 *
 * @since 0.5.0-canary.4
 */
export function createVercelAnalyticsDestination(options: VercelAnalyticsDestinationOptions = {}): Destination {
  return {
    consentRequirement: options.consentRequirement ?? "required",
    name: options.name ?? "vercel-analytics",
    // Synchronous today, but declared async so a throw here rejects the returned Promise
    // instead of escaping as a synchronous throw — matches Destination.send's contract.
    async send(event) {
      track(event.name, flattenEventProps(event.properties, { allowNull: true }));
    },
  };
}
