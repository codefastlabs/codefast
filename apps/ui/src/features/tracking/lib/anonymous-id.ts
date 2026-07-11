import { createServerFn } from "@tanstack/react-start";

/** Shared by the client tracker (reads) and the server functions below (write). */
export const ANONYMOUS_ID_COOKIE_NAME = "codefast-ui-anon-id";

/**
 * Persists (or prolongs) the client-minted anonymous id as a server-set cookie — a
 * script-written cookie is capped at 7 days by Safari ITP, so this `Set-Cookie` re-issue
 * is what lets the id live its full year. Minting stays client-side, after consent: the
 * package helper throws on any value that is not exactly UUID-shaped, so this public
 * endpoint can never echo attacker input into a response header. The browser-poisoned
 * `tanstack-start` subpath stays behind a dynamic import so it never reaches a client chunk.
 */
export const persistAnonymousIdCookie = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { setAnonymousIdResponseCookie } = await import("@codefast/tracking/tanstack-start");

    setAnonymousIdResponseCookie({ cookieName: ANONYMOUS_ID_COOKIE_NAME, id: data.id });
  });

/** The server half of a consent withdrawal — expires the cookie the server re-issued. */
export const clearAnonymousIdCookie = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAnonymousIdResponseCookie } = await import("@codefast/tracking/tanstack-start");

  clearAnonymousIdResponseCookie(ANONYMOUS_ID_COOKIE_NAME);
});
