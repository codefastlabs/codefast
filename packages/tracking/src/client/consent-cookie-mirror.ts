import type { ConsentStorage } from "#/core/consent";
import { encodeConsentCookieValue } from "#/core/consent-cookie";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export interface ConsentCookieMirrorOptions {
  /** Cookie name the server reads via `readConsentDecisionCookie` — must match exactly. */
  cookieName: string;
  /** How long the mirrored record survives. Defaults to one year. */
  maxAgeSeconds?: number | undefined;
}

/**
 * Decorates any `ConsentStorage` so every saved decision is also mirrored into a cookie —
 * the client half of consent-aware server tracking: `localStorage` stays the source of
 * truth the UI reads, while the cookie rides along on requests for
 * `readConsentDecisionCookie` to gate server-owned events. A consent-preference cookie is
 * strictly functional, so it needs no consent of its own.
 */
export function withConsentCookieMirror(storage: ConsentStorage, options: ConsentCookieMirrorOptions): ConsentStorage {
  const { cookieName, maxAgeSeconds = ONE_YEAR_IN_SECONDS } = options;

  function writeCookie(value: string, maxAge: number): void {
    if (typeof document === "undefined") {
      return;
    }

    // Secure on HTTPS; SameSite=Lax; readable by the server on every request (no HttpOnly
    // is fine — the record is the visitor's own, non-secret preference).
    const secure = globalThis.location.protocol === "https:" ? "; secure" : "";

    document.cookie = `${cookieName}=${value}; path=/; max-age=${String(maxAge)}; samesite=lax${secure}`;
  }

  return {
    clear(): void {
      storage.clear();
      writeCookie("", 0);
    },
    load: () => storage.load(),
    save(record): void {
      storage.save(record);
      writeCookie(encodeConsentCookieValue(record), maxAgeSeconds);
    },
    subscribe: (listener) => storage.subscribe(listener),
  };
}
