const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export interface CookieAnonymousIdOptions {
  /** Cookie name — must not collide with another cookie on the domain. */
  cookieName: string;
  /** How long the id survives a return visit. Defaults to one year. */
  maxAgeSeconds?: number;
}

export interface CookieAnonymousId {
  /** Expires the cookie — call when the visitor withdraws tracking consent. */
  clear: () => void;
  /** The existing id, or a freshly minted and persisted one. */
  resolve: () => string;
}

/**
 * A `document.cookie`-backed anonymous id — not `localStorage`-only, so a server-owned
 * event can read the same id from the request and correlate to this visitor. Pass
 * `resolve` (not the result of calling it) as `ClientTrackerOptions.anonymousId`: it's a
 * resolver invoked lazily, so the cookie is minted only once an event is actually allowed
 * to send, never as an import-time side effect.
 */
export function createCookieAnonymousId(options: CookieAnonymousIdOptions): CookieAnonymousId {
  const { cookieName, maxAgeSeconds = ONE_YEAR_IN_SECONDS } = options;
  // Cached after the first resolve() so a resolver invoked once per tracked event doesn't
  // re-parse the whole cookie header every time — cleared alongside the cookie itself.
  let cachedId: string | undefined;

  return {
    clear(): void {
      cachedId = undefined;

      if (typeof document === "undefined") {
        return;
      }

      document.cookie = `${cookieName}=; path=/; max-age=0; samesite=lax`;
    },
    resolve(): string {
      if (cachedId !== undefined) {
        return cachedId;
      }

      if (typeof document === "undefined") {
        return crypto.randomUUID();
      }

      const existing = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${cookieName}=`))
        ?.split("=")[1];

      if (existing) {
        cachedId = existing;

        return existing;
      }

      const id = crypto.randomUUID();

      document.cookie = `${cookieName}=${id}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
      cachedId = id;

      return id;
    },
  };
}
