import { buildAnonymousIdSetCookie, buildClearAnonymousIdSetCookie } from "@codefast/tracking/server";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

/** Shared by the client tracker (reads) and the server functions below (write). */
export const ANONYMOUS_ID_COOKIE_NAME = "codefast-ui-anon-id";

/**
 * Persists (or prolongs) the client-minted anonymous id as a server-set cookie — a
 * script-written cookie is capped at 7 days by Safari ITP, so this `Set-Cookie` re-issue
 * is what lets the id live its full year. Minting stays client-side, after consent:
 * `buildAnonymousIdSetCookie` throws on any value that is not exactly UUID-shaped, so
 * this public endpoint can never echo attacker input into a response header.
 */
export const persistAnonymousIdCookie = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(({ data }) => {
    setResponseHeader("set-cookie", buildAnonymousIdSetCookie({ cookieName: ANONYMOUS_ID_COOKIE_NAME, id: data.id }));
  });

/** The server half of a consent withdrawal — expires the cookie the server re-issued. */
export const clearAnonymousIdCookie = createServerFn({ method: "POST" }).handler(() => {
  setResponseHeader("set-cookie", buildClearAnonymousIdSetCookie(ANONYMOUS_ID_COOKIE_NAME));
});
