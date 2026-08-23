/**
 * A primitive value every destination accepts as an event parameter.
 *
 * @since 0.5.0-canary.6
 */
export type FlatPropertyValue = boolean | number | string;

interface FlattenEventPropsOptions {
  /** Vercel Analytics accepts `null` directly; GA4 (gtag.js/Measurement Protocol) does not. */
  allowNull?: boolean | undefined;
}

/**
 * Event params must be flat string/number/boolean (optionally `null`) — stringify
 * anything else instead of letting the destination silently drop it.
 *
 * @since 0.5.0-canary.6
 */
export function flattenEventProps(properties: Record<string, unknown>): Record<string, FlatPropertyValue>;
/**
 * Flattens event properties while also passing `null` through for destinations that accept it.
 *
 * @since 0.5.0-canary.6
 */
export function flattenEventProps(
  properties: Record<string, unknown>,
  options: { allowNull: true },
): Record<string, FlatPropertyValue | null>;
/**
 * Shared implementation backing both overloads.
 *
 * @since 0.5.0-canary.6
 */
export function flattenEventProps(
  properties: Record<string, unknown>,
  options: FlattenEventPropsOptions = {},
): Record<string, FlatPropertyValue | null> {
  const result: Record<string, FlatPropertyValue | null> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (options.allowNull === true && value === null) {
      result[key] = null;
    } else if (value !== undefined && value !== null) {
      result[key] = JSON.stringify(value);
    }
  }

  return result;
}
