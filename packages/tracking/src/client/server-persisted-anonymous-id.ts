import type { CookieAnonymousId } from "#/client/cookie-anonymous-id";
import { createCookieAnonymousId } from "#/client/cookie-anonymous-id";
import { readCookieValue } from "#/core/cookie";

export interface ServerPersistedAnonymousIdOptions {
  /** Server round-trip that expires the cookie via `Set-Cookie` — the server half of `clear()`. */
  clearOnServer?: (() => Promise<void>) | undefined;
  /** Cookie name — must not collide with another cookie on the domain. */
  cookieName: string;
  /** How long the id survives a return visit. Defaults to one year. */
  maxAgeSeconds?: number | undefined;
  /**
   * Server round-trip that re-sets the cookie via `Set-Cookie` (e.g. a server function
   * calling `buildAnonymousIdSetCookie`). Fired at most once per page load, only after an
   * id exists client-side — the server persists and prolongs, it never mints.
   */
  persist: (id: string) => Promise<void>;
}

/**
 * `createCookieAnonymousId` plus server persistence: the client still mints the id
 * (lazily, only once an event is allowed to send — consent stays client-owned), then
 * delegates the durable write to the server. A script-written cookie is capped at 7 days
 * by Safari ITP; the server's `Set-Cookie` re-issue is what makes the id actually live
 * its full max-age. Same optimistic `document.cookie` write first, so the current event
 * never waits on the round-trip and a failed `persist` degrades to today's behavior.
 */
export function createServerPersistedAnonymousId(options: ServerPersistedAnonymousIdOptions): CookieAnonymousId {
  const { clearOnServer, cookieName, maxAgeSeconds, persist } = options;
  const local = createCookieAnonymousId({ cookieName, maxAgeSeconds });
  // One attempt per page load — a failure is not retried until the next load, so a down
  // endpoint costs one request, not one per event. Tracking must never break the app.
  let hasRequestedPersist = false;

  return {
    clear(): void {
      // Skip the server round-trip when the cookie is already gone (e.g. a second
      // withdrawal clear from another mounted consent surface in the same tick).
      const shouldClearServer =
        typeof document !== "undefined" && Boolean(readCookieValue(document.cookie, cookieName));

      local.clear();
      // A fresh id after a re-grant must be persisted again.
      hasRequestedPersist = false;

      if (shouldClearServer) {
        void clearOnServer?.().catch(() => {
          /* the client-side expiry above already took effect */
        });
      }
    },
    getOrCreate(): string {
      // Cross-tab withdrawal expires the cookie without this instance's `clear()` — reset
      // so the next minted id is server-persisted (ITP re-issue) again.
      if (typeof document !== "undefined" && !readCookieValue(document.cookie, cookieName)) {
        hasRequestedPersist = false;
      }

      const id = local.getOrCreate();

      // Also fires when the cookie already existed: the re-issue upgrades a script-written
      // cookie to a server-set one and rolls its expiry forward on every visit.
      if (!hasRequestedPersist && typeof document !== "undefined") {
        hasRequestedPersist = true;
        void persist(id).catch(() => {
          /* optimistic client-side cookie still covers this session */
        });
      }

      return id;
    },
  };
}
