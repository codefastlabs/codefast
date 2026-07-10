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
  properties: Record<string, unknown>;
  type: "track";
}

export interface PageViewEvent extends TrackedEventBase {
  /** Page name or path as given to `page()`. */
  name?: string | undefined;
  properties: Record<string, unknown>;
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
 * (Segment-style) — destinations `switch` on the kind and translate into their own
 * vocabulary, ignoring kinds they have no equivalent for.
 *
 * @since 0.5.0-canary.4
 */
export type TrackedEvent = AliasEvent | GroupEvent | IdentifyEvent | PageViewEvent | TrackEvent;

/**
 * Per-kind payload of an envelope — trackers fill in the shared {@link TrackedEventBase}
 * fields via {@link buildTrackedEvent}.
 */
export type TrackedEventSeed = TrackedEvent extends infer Event
  ? Event extends TrackedEvent
    ? Omit<Event, keyof TrackedEventBase>
    : never
  : never;

/**
 * Rejoins a kind-specific seed with the shared base fields into a {@link TrackedEvent}.
 * Switching on `seed.type` keeps each branch assignable without a union assertion.
 */
export function buildTrackedEvent(seed: TrackedEventSeed, base: TrackedEventBase): TrackedEvent {
  switch (seed.type) {
    case "alias": {
      return { ...base, ...seed };
    }

    case "group": {
      return { ...base, ...seed };
    }

    case "identify": {
      return { ...base, ...seed };
    }

    case "page": {
      return { ...base, ...seed };
    }

    case "track": {
      return { ...base, ...seed };
    }

    default: {
      return assertNever(seed);
    }
  }
}

function isTrackedEventBase(record: Record<string, unknown>): boolean {
  return (
    typeof record.anonymousId === "string" &&
    typeof record.eventId === "string" &&
    typeof record.timestamp === "number" &&
    (record.userId === undefined || typeof record.userId === "string") &&
    (record.owner === undefined || record.owner === "client" || record.owner === "server")
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Guards records read back from untrusted storage (e.g. a pre-migration offline queue). */
export function isTrackedEvent(value: unknown): value is TrackedEvent {
  if (!isPlainObject(value)) {
    return false;
  }

  const record = value;

  if (!isTrackedEventBase(record)) {
    return false;
  }

  switch (record.type) {
    case "alias": {
      return typeof record.previousId === "string";
    }

    case "group": {
      return typeof record.groupId === "string" && isPlainObject(record.traits);
    }

    case "identify": {
      return isPlainObject(record.traits);
    }

    case "page": {
      return (record.name === undefined || typeof record.name === "string") && isPlainObject(record.properties);
    }

    case "track": {
      return typeof record.name === "string" && isPlainObject(record.properties);
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
