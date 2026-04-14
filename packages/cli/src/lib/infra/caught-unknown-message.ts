/**
 * Stable, user-facing text for values caught as `unknown`.
 * Avoids `String(unknown)` / `[object Object]` and satisfies strict `no-base-to-string`.
 */
export function messageFromCaughtUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "symbol") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized === "string") {
      return serialized;
    }
  } catch {
    // Circular structure, BigInt in tree, etc.
  }
  return "[unserializable non-Error value]";
}
