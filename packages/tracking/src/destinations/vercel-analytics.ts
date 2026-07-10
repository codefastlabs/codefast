import { track } from "@vercel/analytics";

import type { Destination } from "#/core/destination";
import { assertNever } from "#/core/tracked-event";
import { flattenEventProps, omitHref } from "#/destinations/shared";

export interface VercelAnalyticsDestinationOptions {
  /**
   * Vercel Analytics is cookieless and its events carry no identifier from this
   * package, so it qualifies for `"exempt"` — it then keeps receiving events while the
   * tracker's consent gate is closed. Defaults to `"required"` so pre-consent delivery
   * stays an explicit opt-in.
   */
  consent?: "exempt" | "required" | undefined;
  name?: string | undefined;
  /**
   * Forward `page` envelopes as a `page_view` custom event. Off by default: the mounted
   * `<Analytics />` component already tracks page views natively, so forwarding here
   * would double-count them (and burn the custom-events quota).
   */
  trackPageViews?: boolean | undefined;
}

/**
 * `track()` only pushes onto Vercel's own in-page queue (`window.va`/`window.vaq`), which
 * handles batching and unload delivery itself — hence `delivery: "immediate"`. Requires
 * the Vercel Analytics script to be loaded once elsewhere in the app (`<Analytics />` from
 * `@vercel/analytics/react`, or the framework-agnostic `inject()`) — this destination only
 * queues events, so it imports the base `@vercel/analytics` package and has no React
 * dependency of its own. `identify`/`group`/`alias` envelopes are dropped — Vercel
 * Analytics has no user or group identity API to translate them to.
 *
 * @since 0.5.0-canary.4
 */
export function createVercelAnalyticsDestination(options: VercelAnalyticsDestinationOptions = {}): Destination {
  return {
    consent: options.consent ?? "required",
    delivery: "immediate",
    name: options.name ?? "vercel-analytics",
    // Synchronous today, but declared async so a throw here rejects the returned Promise
    // instead of escaping as a synchronous throw — matches Destination.send's contract.
    async send(event) {
      switch (event.type) {
        case "alias":
        case "group":
        case "identify": {
          return;
        }

        case "page": {
          if (options.trackPageViews === true) {
            // Vercel attaches the page context itself.
            track("page_view", flattenEventProps(omitHref(event.props), { allowNull: true }));
          }

          return;
        }

        case "track": {
          track(event.name, flattenEventProps(event.props, { allowNull: true }));

          return;
        }

        default: {
          assertNever(event);
        }
      }
    },
  };
}
