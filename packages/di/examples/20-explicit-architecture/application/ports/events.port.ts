/** The outbound ports for publishing and subscribing to domain events, and their tokens. */

import { token } from "@codefast/di";

import type { DomainEvent } from "#/examples/20-explicit-architecture/domain/events";

// ── Ports ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Announces a domain event to whatever adapters have subscribed. */
export interface EventPublisher {
  /** Delivers `event` to every subscriber. */
  publish(event: DomainEvent): void;
}

/** A single subscriber that reacts to published domain events. */
export interface EventHandler {
  /** Reacts to `event`. */
  handle(event: DomainEvent): void;
}

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The injection token that names the event-publishing port. */
export const EventPublisherToken = token<EventPublisher>("EventPublisher");

/** The injection token that names the event-subscriber port — bound once per subscriber slot. */
export const EventHandlerToken = token<EventHandler>("EventHandler");
