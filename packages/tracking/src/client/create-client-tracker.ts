import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { Destination } from "#/core/destination";
import type { EventCatalog } from "#/core/event-catalog";
import { assertValidEventProperties } from "#/core/event-catalog";
import { generateEventId } from "#/core/event-id";
import type { TrackedEvent } from "#/core/tracked-event";

/**
 * `Destination.send` is typed to always return a `Promise`, but that's unenforceable at
 * runtime for a third-party/plain-JS destination — one that ignores the contract and
 * throws synchronously (or returns a non-`Promise`) must still never break the tracked
 * interaction. `Promise.resolve(...)` normalizes a non-`Promise` return; the outer
 * try/catch is the only thing that can catch a throw that happens before `send` ever
 * gets to return anything.
 */
function sendToDestination(destination: Destination, event: TrackedEvent): void {
  try {
    void Promise.resolve(destination.send(event)).catch(() => {
      /* a destination owns its transport — tracking must never break the interaction */
    });
  } catch {
    /* a sync throw must never break the tracked interaction */
  }
}

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTrackerOptions<Catalog extends EventCatalog> {
  /** Invoked per allowed event — defer creating the id (e.g. minting a cookie) until an event is actually allowed to send, never as an import-time side effect. */
  anonymousId: () => string;
  catalog: Catalog;
  destinations: Array<Destination>;
  /**
   * Consulted before every event — while it returns `false`, only
   * `consentRequirement: "exempt"` destinations still receive events, stripped of
   * identifiers. Omit to always track.
   */
  isAnalyticsAllowed?: (() => boolean) | undefined;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTracker<Catalog extends EventCatalog> {
  track: <Name extends keyof Catalog & string>(
    name: Name,
    properties: StandardSchemaV1.InferOutput<Catalog[Name]["schema"]>,
  ) => void;
}

/**
 * @since 0.5.0-canary.4
 */
export function createClientTracker<Catalog extends EventCatalog>(
  options: ClientTrackerOptions<Catalog>,
): ClientTracker<Catalog> {
  // The exempt lane only carries what a cookieless sink may see — identifier-free counts.
  const exemptDestinations = options.destinations.filter((destination) => destination.consentRequirement === "exempt");

  return {
    track(name, properties) {
      // noUncheckedIndexedAccess types this as possibly undefined; the check also guards
      // callers who bypass the catalog key type with an `as` cast.
      const definition = options.catalog[name];

      if (!definition) {
        throw new Error(`Unknown event: ${String(name)}`);
      }

      // Forward the parsed output (not the raw input) so unknown keys cannot ride along.
      const validatedProperties = assertValidEventProperties(definition.schema, name, properties);

      // The gate runs per event (not at creation) so a consent change mid-session applies immediately.
      const isAllowed = options.isAnalyticsAllowed?.() !== false;

      if (!isAllowed && exemptDestinations.length === 0) {
        return;
      }

      const event: TrackedEvent = {
        // Gated events ship identifier-free: no anonymousId is resolved, so none is ever
        // minted as a side effect.
        anonymousId: isAllowed ? options.anonymousId() : "",
        eventId: generateEventId(),
        name,
        properties: validatedProperties as Record<string, unknown>,
        timestamp: Date.now(),
        type: "track",
      };

      for (const destination of isAllowed ? options.destinations : exemptDestinations) {
        sendToDestination(destination, event);
      }
    },
  };
}
