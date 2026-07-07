/**
 * Envelope every tracker (client/server) builds before handing an event to a destination.
 *
 * @since 0.5.0-canary.4
 */
export interface TrackedEvent {
  anonymousId: string;
  eventId: string;
  name: string;
  owner: "client" | "server";
  props: Record<string, unknown>;
  timestamp: number;
  userId?: string | undefined;
}
