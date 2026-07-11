import { writeBrowserCookie } from "#/client/browser-cookie";
import type { ConsentStorage } from "#/core/consent";
import { encodeConsentCookieValue } from "#/core/consent-cookie";
import { ONE_YEAR_IN_SECONDS } from "#/core/cookie";

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

  return {
    clear(): void {
      storage.clear();
      writeBrowserCookie(cookieName, "", 0);
    },
    load: () => storage.load(),
    save(record): void {
      storage.save(record);
      writeBrowserCookie(cookieName, encodeConsentCookieValue(record), maxAgeSeconds);
    },
    subscribe: (listener) => storage.subscribe(listener),
  };
}
