/** Default lifetime shared by the anonymous-id and consent cookies — one year. */
export const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * The value of `cookieName` inside a cookie string — a request `Cookie` header or
 * `document.cookie`, which share the `name=value; name2=value2` wire format — or
 * `undefined` when absent. The name must match exactly; a longer prefix sibling is ignored.
 */
export function readCookieValue(cookieString: string | null | undefined, cookieName: string): string | undefined {
  if (!cookieString) {
    return undefined;
  }

  for (const part of cookieString.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex !== -1 && part.slice(0, separatorIndex).trim() === cookieName) {
      return part.slice(separatorIndex + 1).trim();
    }
  }

  return undefined;
}
