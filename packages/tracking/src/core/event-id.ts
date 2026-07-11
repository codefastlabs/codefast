/**
 * Stamped on every envelope at track time — destinations that dedupe can key on it.
 *
 * @since 0.5.0-canary.4
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}
