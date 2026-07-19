/**
 * The event envelope destinations receive. `type` stays a discriminant so a future envelope
 * kind is an additive union member, not a wire-format break.
 *
 * @since 0.5.0-canary.4
 */
export interface TrackedEvent {
  anonymousId: string;
  eventId: string;
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
  type: "track";
}
