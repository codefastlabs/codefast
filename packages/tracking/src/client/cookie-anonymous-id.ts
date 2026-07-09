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
  getOrCreate: () => string;
}

function readCookie(cookieName: string): string | undefined {
  for (const part of document.cookie.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex !== -1 && part.slice(0, separatorIndex).trim() === cookieName) {
      return part.slice(separatorIndex + 1).trim();
    }
  }

  return undefined;
}

function writeCookie(cookieName: string, value: string, maxAgeSeconds: number): void {
  // Secure on HTTPS so the id isn't sent over plain HTTP; SameSite=Lax is enough for a
  // first-party anonymous id that must stay readable from document.cookie (no HttpOnly).
  const secure = globalThis.location.protocol === "https:" ? "; secure" : "";

  document.cookie = `${cookieName}=${value}; path=/; max-age=${String(maxAgeSeconds)}; samesite=lax${secure}`;
}

/**
 * A `document.cookie`-backed anonymous id — not `localStorage`-only, so a server-owned
 * event can read the same id from the request and correlate to this visitor. Pass
 * `getOrCreate` (not the result of calling it) as `ClientTrackerOptions.anonymousId`:
 * it's invoked lazily, so the cookie is minted only once an event is actually allowed to
 * send, never as an import-time side effect.
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

      writeCookie(cookieName, "", 0);
    },
    getOrCreate(): string {
      if (cachedId !== undefined) {
        return cachedId;
      }

      if (typeof document === "undefined") {
        return crypto.randomUUID();
      }

      const existing = readCookie(cookieName);

      if (existing) {
        cachedId = existing;

        return existing;
      }

      const id = crypto.randomUUID();

      writeCookie(cookieName, id, maxAgeSeconds);
      cachedId = id;

      return id;
    },
  };
}
