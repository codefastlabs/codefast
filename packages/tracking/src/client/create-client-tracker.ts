import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ConsentDecision } from "#core/consent";
import type { Destination } from "#core/destination";
import type { EventCatalog } from "#core/event-catalog";
import { assertValidEventProperties } from "#core/event-catalog";
import { generateEventId } from "#core/event-id";
import type { TrackedEvent } from "#core/tracked-event";

/**
 * Context handed to {@link ClientTrackerOptions.onDeliveryError} for one failed delivery.
 *
 * @since 0.5.0-canary.6
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
  consent: ConsentDecision | undefined,
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
    void Promise.resolve(destination.send(event, consent)).catch(report);
  } catch (error) {
    report(error);
  }
}

/** A destination without its own rule is a measurement sink, so it follows `analytics`. */
function isPermitted(destination: Destination, consent: ConsentDecision): boolean {
  return destination.isPermittedBy ? destination.isPermittedBy(consent) : consent.analytics;
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
 * Options for `createClientTracker`.
 *
 * @since 0.5.0-canary.4
 */
export interface ClientTrackerOptions<Catalog extends EventCatalog> {
  /** Invoked per allowed event, so creating the id (minting a cookie) waits until an event may actually send. */
  anonymousId: () => string;
  catalog: Catalog;
  destinations: Array<Destination>;
  /**
   * The visitor's effective consent, read once per event and checked against each
   * destination's {@link Destination.isPermittedBy} — a destination it does not permit
   * receives nothing, unless it is `consentRequirement: "exempt"`, which then receives the
   * event stripped of identifiers. Omit to always track.
   */
  getConsent?: (() => ConsentDecision) | undefined;
  /**
   * Consulted before an `exempt` destination receives an event its consent does not permit. ePrivacy
   * audience-measurement exemption is jurisdiction-dependent, so it MUST be gateable per region rather than assumed
   * global — return `false` where exemption is not defensible and even exempt sinks are withheld. Omit to treat exempt
   * destinations as exempt everywhere.
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
 * A client-side tracker delivering catalog-validated events to destinations, plus erasure on withdrawal.
 *
 * @since 0.5.0-canary.4
 */
export interface ClientTracker<Catalog extends EventCatalog> {
  /**
   * Runs each destination's {@link Destination.onErasure} once on withdrawal, passing the subject id to erase. Failures
   * are swallowed so a destination that throws never breaks the withdrawal flow.
   */
  erase: (id: string) => void;
  track: <Name extends keyof Catalog & string>(
    name: Name,
    properties: StandardSchemaV1.InferOutput<Catalog[Name]["schema"]>,
  ) => void;
}

/**
 * Creates a consent-gated tracker that validates each event against the catalog and fans it out to destinations.
 *
 * @since 0.5.0-canary.4
 */
export function createClientTracker<Catalog extends EventCatalog>(
  options: ClientTrackerOptions<Catalog>,
): ClientTracker<Catalog> {
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
      const consent = options.getConsent?.();
      const permittedDestinations =
        consent === undefined
          ? options.destinations
          : options.destinations.filter((destination) => isPermitted(destination, consent));
      const unpermittedExemptDestinations = options.destinations.filter(
        (destination) => destination.consentRequirement === "exempt" && !permittedDestinations.includes(destination),
      );
      // Exempt sinks still receive identifier-free events — but only where exemption is
      // defensible; a `false` here withholds them too.
      const exemptDestinations =
        unpermittedExemptDestinations.length > 0 && options.isExemptionAllowed?.() !== false
          ? unpermittedExemptDestinations
          : [];

      if (permittedDestinations.length === 0 && exemptDestinations.length === 0) {
        return;
      }

      const envelope: Omit<TrackedEvent, "anonymousId"> = {
        eventId: generateEventId(),
        name,
        properties: validatedProperties as Record<string, unknown>,
        timestamp: Date.now(),
        type: "track",
      };

      if (permittedDestinations.length > 0) {
        // Resolved only once some destination may receive it, so no id is ever minted for a gated event.
        const event: TrackedEvent = { ...envelope, anonymousId: options.anonymousId() };

        for (const destination of permittedDestinations) {
          sendToDestination(destination, event, consent, options.onDeliveryError);
        }
      }

      const strippedEvent: TrackedEvent = { ...envelope, anonymousId: "" };

      for (const destination of exemptDestinations) {
        sendToDestination(destination, strippedEvent, consent, options.onDeliveryError);
      }
    },
  };
}
