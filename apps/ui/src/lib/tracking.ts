import { defineEventCatalog } from "@codefast/tracking";

/**
 * Empty for now — page views go through `tracker.page()` regardless of the catalog.
 * Add real events here as features need them (e.g. a copy-button click).
 */
export const catalog = defineEventCatalog({});

const ANONYMOUS_ID_COOKIE = "codefast-ui-anon-id";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * A cookie (not `localStorage`-only) so a future server-owned event can read the same
 * ID and correlate to this visitor.
 */
export function getOrCreateAnonymousId(): string {
  const existing = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ANONYMOUS_ID_COOKIE}=`))
    ?.split("=")[1];

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();

  document.cookie = `${ANONYMOUS_ID_COOKIE}=${id}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;

  return id;
}
