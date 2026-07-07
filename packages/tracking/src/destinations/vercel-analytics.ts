import { track } from "@vercel/analytics/react";

import type { Destination } from "#/core/destination";

type VercelAnalyticsPropertyValue = boolean | number | string | null;

/**
 * Vercel's `track()` rejects nested objects/arrays outright — flatten anything else
 * to a string instead of silently dropping it.
 */
function toVercelAnalyticsProps(props: Record<string, unknown>): Record<string, VercelAnalyticsPropertyValue> {
  const result: Record<string, VercelAnalyticsPropertyValue> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (value !== undefined) {
      result[key] = JSON.stringify(value);
    }
  }

  return result;
}

/**
 * `track()` only pushes onto Vercel's own in-page queue (`window.va`/`window.vaq`), which
 * handles batching and unload delivery itself — hence `delivery: "immediate"`. Requires
 * `<Analytics />` from `@vercel/analytics/react` to be mounted once in the app.
 *
 * @since 0.5.0-canary.4
 */
export function createVercelAnalyticsDestination(name = "vercel-analytics"): Destination {
  return {
    delivery: "immediate",
    name,
    send(event) {
      track(event.name, toVercelAnalyticsProps(event.props));
    },
  };
}
