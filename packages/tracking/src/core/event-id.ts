/**
 * Client-owned events use this at enqueue time. Server-owned events use it too, unless
 * the caller supplies a `requestId` (see {@link deriveEventId}) for retry idempotency.
 *
 * @since 0.5.0-canary.4
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * FNV-1a — fast, deterministic, no external dependency; collision resistance doesn't need
 * to be cryptographic here, only good enough to tell apart the handful of event kinds one
 * request fires.
 */
function fnv1a32(input: string, seed: number): number {
  let hash = seed;

  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 16_777_619);
  }

  return hash >>> 0;
}

/**
 * Deterministic alternative to {@link generateEventId} for server-owned events: the same
 * `requestId` + `discriminant` always yields the same id, so retrying the same request
 * re-sends the same `eventId` instead of minting a new one — a destination that dedupes
 * on `eventId` treats the retry as a no-op rather than double-counting it.
 *
 * Not a cryptographic hash and not RFC 4122 UUID-shaped — only a stable identifier.
 * Two calls in the same request with an identical `discriminant` collide by design (they
 * describe the same logical event); pass a distinguishing `discriminant` for calls that
 * are meant to be tracked as separate events within one request.
 *
 * @param requestId - a stable identifier for the request, unchanged across retries
 * @param discriminant - distinguishes concurrent event kinds within the same request
 */
export function deriveEventId(requestId: string, discriminant: string): string {
  const high = fnv1a32(`${requestId} ${discriminant}`, 0x811c_9dc5);
  const low = fnv1a32(`${discriminant} ${requestId}`, 0x1000_0193);

  return `${high.toString(16).padStart(8, "0")}${low.toString(16).padStart(8, "0")}`;
}
