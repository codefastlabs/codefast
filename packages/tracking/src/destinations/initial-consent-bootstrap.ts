import type { InitialConsent } from "#/core/consent";

const DEFAULT_WINDOW_KEY = "__INITIAL_CONSENT__";

export interface BuildInitialConsentBootstrapScriptOptions {
  /** Cookie set by edge middleware with a JSON `InitialConsent` payload. */
  cookieName: string;
  /** SSR/prerender fallback when the cookie is missing or corrupt. */
  fallback: InitialConsent;
  /**
   * `window` property that receives the resolved value. Defaults to
   * `"__INITIAL_CONSENT__"` — must match whatever the client reads after hydration.
   */
  windowKey?: string | undefined;
}

/**
 * Pre-hydration script that prefers a middleware-set consent cookie over a baked
 * fallback — for statically prerendered TanStack Start pages where the shell cannot
 * wait on a root loader for geo.
 */
export function buildInitialConsentBootstrapScript(options: BuildInitialConsentBootstrapScriptOptions): string {
  const windowKey = options.windowKey ?? DEFAULT_WINDOW_KEY;

  return `
    (function () {
      var fallback = ${JSON.stringify(options.fallback)};
      var match = document.cookie.match(/(?:^|; )${options.cookieName}=([^;]*)/);
      var resolved = fallback;
      if (match) {
        try {
          resolved = JSON.parse(decodeURIComponent(match[1]));
        } catch (e) {}
      }
      window[${JSON.stringify(windowKey)}] = resolved;
    })();
  `;
}
