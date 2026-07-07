import type { Destination } from "#/core/destination";

/**
 * @since 0.5.0-canary.4
 */
export interface HttpDestinationOptions {
  endpoint: string;
  headers?: Record<string, string>;
  name: string;
}

/**
 * Generic fetch-based `Destination` — the building block for a real provider adapter
 * (PostHog, GA4, ...); those ship their own payload shape and aren't implemented here.
 *
 * @since 0.5.0-canary.4
 */
export function createHttpDestination(options: HttpDestinationOptions): Destination {
  return {
    name: options.name,
    async send(event) {
      const response = await fetch(options.endpoint, {
        body: JSON.stringify(event),
        headers: { "content-type": "application/json", ...options.headers },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`"${options.name}" destination responded with ${String(response.status)}`);
      }
    },
  };
}
