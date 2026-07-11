import { writeBrowserCookie } from "#/client/browser-cookie";
import { ONE_YEAR_IN_SECONDS, readCookieValue } from "#/core/cookie";

/**
 * @since 1.0.0-canary.6
 */
export interface CookieAnonymousIdOptions {
  /** Cookie name — must not collide with another cookie on the domain. */
  cookieName: string;
  /** How long the id survives a return visit. Defaults to one year. */
  maxAgeSeconds?: number | undefined;
}

/**
 * @since 1.0.0-canary.6
 */
export interface CookieAnonymousId {
  /** Expires the cookie — call when the visitor withdraws tracking consent. */
  clear: () => void;
  /** The existing id, or a freshly minted and persisted one. */
  getOrCreate: () => string;
  /**
   * Rolls an *existing* id's expiry forward without ever minting one — safe to call on
   * page load for returning consented visitors (the ITP-refresh path), a no-op for
   * visitors who never got an id.
   */
  refresh: () => void;
}

/**
 * A `document.cookie`-backed anonymous id — not `localStorage`-only, so a server-owned
 * event can read the same id from the request and correlate to this visitor. Pass
 * `getOrCreate` (not the result of calling it) as `ClientTrackerOptions.anonymousId`:
 * it's invoked lazily, so the cookie is minted only once an event is actually allowed to
 * send, never as an import-time side effect.
 *
 * @since 1.0.0-canary.6
 */
export function createCookieAnonymousId(options: CookieAnonymousIdOptions): CookieAnonymousId {
  const { cookieName, maxAgeSeconds = ONE_YEAR_IN_SECONDS } = options;
  // Cached after the first getOrCreate() so a callback invoked once per tracked event
  // doesn't re-parse the whole cookie header every time — cleared alongside the cookie.
  let cachedId: string | undefined;

  return {
    clear(): void {
      cachedId = undefined;

      if (typeof document === "undefined") {
        return;
      }

      writeBrowserCookie(cookieName, "", 0);
    },
    getOrCreate(): string {
      if (typeof document === "undefined") {
        return cachedId ?? crypto.randomUUID();
      }

      const existing = readCookieValue(document.cookie, cookieName);

      // Prefer the live cookie over `cachedId` — another tab's withdrawal expires the
      // cookie without calling this instance's `clear()`, and a re-grant must not revive
      // the pre-withdrawal identity from memory.
      if (existing) {
        cachedId = existing;

        return existing;
      }

      cachedId = undefined;

      const id = crypto.randomUUID();

      writeBrowserCookie(cookieName, id, maxAgeSeconds);
      cachedId = id;

      return id;
    },
    refresh(): void {
      if (typeof document === "undefined") {
        return;
      }

      const existing = readCookieValue(document.cookie, cookieName);

      if (existing) {
        cachedId = existing;
        writeBrowserCookie(cookieName, existing, maxAgeSeconds);
      }
    },
  };
}
