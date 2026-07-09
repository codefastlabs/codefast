/** Fields shared by every envelope the trackers build. */
export interface TrackedEventBase {
  anonymousId: string;
  eventId: string;
  owner: "client" | "server";
  timestamp: number;
  userId?: string | undefined;
}

/** A catalog-defined custom event — the only kind that carries an app-chosen name. */
export interface TrackEvent extends TrackedEventBase {
  name: string;
  props: Record<string, unknown>;
  type: "track";
}

export interface PageViewEvent extends TrackedEventBase {
  /** Page name or path as given to `page()`. */
  name?: string | undefined;
  props: Record<string, unknown>;
  type: "page";
}

export interface IdentifyEvent extends TrackedEventBase {
  traits: Record<string, unknown>;
  type: "identify";
}

export interface GroupEvent extends TrackedEventBase {
  groupId: string;
  traits: Record<string, unknown>;
  type: "group";
}

/** Explicit anonymous → known-user merge; `userId` on the base carries the new identity. */
export interface AliasEvent extends TrackedEventBase {
  previousId: string;
  type: "alias";
}

/**
 * Envelope every tracker (client/server) hands to destinations, discriminated on `type`
 * (Segment-style) — destinations translate each kind into their own vocabulary instead
 * of pattern-matching magic event names, and ignore kinds they have no equivalent for.
 *
 * @since 0.5.0-canary.4
 */
export type TrackedEvent = AliasEvent | GroupEvent | IdentifyEvent | PageViewEvent | TrackEvent;

function isTrackedEventBase(record: Record<string, unknown>): boolean {
  return (
    typeof record.anonymousId === "string" &&
    typeof record.eventId === "string" &&
    typeof record.timestamp === "number" &&
    (record.userId === undefined || typeof record.userId === "string") &&
    (record.owner === undefined || record.owner === "client" || record.owner === "server")
  );
}

function isPlainPropsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Guards records read back from untrusted storage (e.g. a pre-migration offline queue). */
export function isTrackedEvent(value: unknown): value is TrackedEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (!isTrackedEventBase(record)) {
    return false;
  }

  switch (record.type) {
    case "alias": {
      return typeof record.previousId === "string";
    }

    case "group": {
      return typeof record.groupId === "string" && isPlainPropsRecord(record.traits);
    }

    case "identify": {
      return isPlainPropsRecord(record.traits);
    }

    case "page": {
      return (record.name === undefined || typeof record.name === "string") && isPlainPropsRecord(record.props);
    }

    case "track": {
      return typeof record.name === "string" && isPlainPropsRecord(record.props);
    }

    default: {
      return false;
    }
  }
}

/**
 * Exhaustiveness guard for a `switch` over {@link TrackedEvent} — put this in the
 * `default` case. Adding a new `TrackedEvent` variant without updating every switch then
 * fails to compile here instead of silently falling through at runtime.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled TrackedEvent variant: ${JSON.stringify(value)}`);
}
