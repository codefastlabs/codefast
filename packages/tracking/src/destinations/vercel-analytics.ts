import { track } from "@vercel/analytics/react";

import type { Destination } from "#/core/destination";
import { flattenEventProps, omitHref } from "#/destinations/shared";

export interface VercelAnalyticsDestinationOptions {
  /**
   * Vercel Analytics is cookieless and its events carry no identifier from this
   * package, so it qualifies for `"exempt"` — it then keeps receiving events while the
   * tracker's consent gate is closed. Defaults to `"required"` so pre-consent delivery
   * stays an explicit opt-in.
   */
  consent?: "exempt" | "required";
  name?: string;
  /**
   * Forward `page` envelopes as a `page_view` custom event. Off by default: the mounted
   * `<Analytics />` component already tracks page views natively, so forwarding here
   * would double-count them (and burn the custom-events quota).
   */
  trackPageViews?: boolean;
}

/**
 * `track()` only pushes onto Vercel's own in-page queue (`window.va`/`window.vaq`), which
 * handles batching and unload delivery itself — hence `delivery: "immediate"`. Requires
 * `<Analytics />` from `@vercel/analytics/react` to be mounted once in the app.
 * `identify`/`group`/`alias` envelopes are dropped — Vercel Analytics has no user or
 * group identity API to translate them to.
 *
 * @since 0.5.0-canary.4
 */
export function createVercelAnalyticsDestination(options: VercelAnalyticsDestinationOptions = {}): Destination {
  return {
    consent: options.consent ?? "required",
    delivery: "immediate",
    name: options.name ?? "vercel-analytics",
    send(event) {
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
        }
      }
    },
  };
}
