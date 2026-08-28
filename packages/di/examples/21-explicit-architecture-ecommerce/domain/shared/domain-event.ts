/** The base shape every domain event shares — a named fact and the instant it happened. */

/** A record that something meaningful occurred in the domain. */
export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}
