/**
 * Client-owned events use this at enqueue time; server-owned events derive an ID
 * from the request instead so retries of the same request don't double-count.
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}
