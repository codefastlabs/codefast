/** Fields shared by every envelope the tracker builds. */
export interface TrackedEventBase {
  anonymousId: string;
  eventId: string;
  timestamp: number;
}

/** A catalog-defined event envelope, as handed to destinations. */
export interface TrackEvent extends TrackedEventBase {
  name: string;
  properties: Record<string, unknown>;
  type: "track";
}

/**
 * The envelope destinations receive. `type` stays a discriminant so a future kind is an
 * additive union member, not a wire-format break.
 *
 * @since 0.5.0-canary.4
 */
export type TrackedEvent = TrackEvent;
