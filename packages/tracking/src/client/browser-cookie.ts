/**
 * Shared `document.cookie` writer for the client-side cookie lanes (anonymous id, consent
 * mirror): Secure on HTTPS so values never ride plain HTTP, SameSite=Lax, never HttpOnly —
 * the client must read its own cookies back. A no-op without a `document` (SSR).
 *
 * @since 1.0.0-canary.6
 */
export function writeBrowserCookie(cookieName: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = globalThis.location.protocol === "https:" ? "; secure" : "";

  document.cookie = `${cookieName}=${value}; path=/; max-age=${String(maxAgeSeconds)}; samesite=lax${secure}`;
}
