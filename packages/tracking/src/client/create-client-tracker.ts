import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { Destination } from "#/core/destination";
import type { EventCatalog } from "#/core/event-catalog";
import { assertValidEventProperties } from "#/core/event-catalog";
import { generateEventId } from "#/core/event-id";
import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Context handed to {@link ClientTrackerOptions.onDeliveryError} for one failed delivery.
 *
 * @since 1.0.0-canary.7
 */
export interface DeliveryErrorContext {
  destination: Destination;
  error: unknown;
  event: TrackedEvent;
}

/**
 * `Destination.send` is typed to always return a `Promise`, but that's unenforceable at
 * runtime for a third-party/plain-JS destination — one that ignores the contract and
 * throws synchronously (or returns a non-`Promise`) must still never break the tracked
 * interaction. `Promise.resolve(...)` normalizes a non-`Promise` return; the outer
 * try/catch is the only thing that can catch a throw that happens before `send` ever
 * gets to return anything. Both failure shapes surface through `onDeliveryError` (itself
 * guarded — an observer that throws must not break the interaction either).
 */
function sendToDestination(
  destination: Destination,
  event: TrackedEvent,
  onDeliveryError?: (context: DeliveryErrorContext) => void,
): void {
  const report = (error: unknown): void => {
    if (!onDeliveryError) {
      return;
    }

    try {
      onDeliveryError({ destination, error, event });
    } catch {
      /* an observer must never break the tracked interaction */
    }
  };

  try {
    void Promise.resolve(destination.send(event)).catch(report);
  } catch (error) {
    report(error);
  }
}

/** Invokes a destination's erasure once, swallowing both failure shapes — DSR must never break the flow. */
function eraseInDestination(destination: Destination, id: string): void {
  try {
    void Promise.resolve(destination.onErasure?.(id)).catch(() => {
      /* an erasure failure must never break the withdrawal flow */
    });
  } catch {
    /* a sync throw must never break the withdrawal flow */
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
  /**
   * Consulted before an `exempt` destination receives an event while the gate is closed.
   * ePrivacy audience-measurement exemption is jurisdiction-dependent (spec-destinations
   * §2), so it MUST be gateable per region rather than assumed global — return `false`
   * where exemption is not defensible and even exempt sinks are withheld. Omit to treat
   * exempt destinations as exempt everywhere.
   */
  isExemptionAllowed?: (() => boolean) | undefined;
  /**
   * Notified once per failed delivery (a destination throwing or rejecting) so a consumer
   * can meter the failure — the tracker still swallows it so tracking never breaks the
   * interaction. Wire it to a monitor in production.
   */
  onDeliveryError?: ((context: DeliveryErrorContext) => void) | undefined;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTracker<Catalog extends EventCatalog> {
  /**
   * Runs each destination's {@link Destination.onErasure} once on withdrawal (spec-data-subject-rights
   * DSR-V2), passing the subject id to erase. Failures are swallowed so a destination that
   * throws never breaks the withdrawal flow.
   */
  erase: (id: string) => void;
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
    erase(id) {
      for (const destination of options.destinations) {
        eraseInDestination(destination, id);
      }
    },
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

      // While gated, exempt sinks still receive identifier-free events — but only where
      // exemption is defensible (spec-destinations §2); a `false` here withholds them too.
      const activeDestinations = isAllowed
        ? options.destinations
        : options.isExemptionAllowed?.() === false
          ? []
          : exemptDestinations;

      if (activeDestinations.length === 0) {
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

      for (const destination of activeDestinations) {
        sendToDestination(destination, event, options.onDeliveryError);
      }
    },
  };
}
