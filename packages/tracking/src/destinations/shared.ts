import type { GroupEvent } from "#/core/tracked-event";

export type FlatPropertyValue = boolean | number | string;

interface FlattenEventPropsOptions {
  /** Vercel Analytics accepts `null` directly; GA4 (gtag.js/Measurement Protocol) does not. */
  allowNull?: boolean | undefined;
}

/**
 * Event params must be flat string/number/boolean (optionally `null`) — stringify
 * anything else instead of letting the destination silently drop it.
 */
export function flattenEventProps(properties: Record<string, unknown>): Record<string, FlatPropertyValue>;
export function flattenEventProps(
  properties: Record<string, unknown>,
  options: { allowNull: true },
): Record<string, FlatPropertyValue | null>;
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

/** GA4's "join_group" recommended event maps a group association onto `group_id` plus the caller's traits. */
export function toJoinGroupPayload(event: Pick<GroupEvent, "groupId" | "traits">): Record<string, unknown> {
  return { group_id: event.groupId, ...event.traits };
}

/** gtag.js/Vercel attach the live page's `href` themselves — forward only the caller's extra properties. */
export function omitHref(properties: Record<string, unknown>): Record<string, unknown> {
  const { href: _href, ...extras } = properties;

  return extras;
}
