import { describe, expect, it } from "vitest";

import {
  buildAnonymousIdSetCookie,
  buildClearAnonymousIdSetCookie,
  isValidAnonymousId,
} from "#/server/anonymous-id-cookie";

const COOKIE_NAME = "test-anon-id";
const VALID_ID = "3b241101-e2bb-4255-8caf-4136c566a962";

describe("isValidAnonymousId", () => {
  it("accepts a crypto.randomUUID-shaped value", () => {
    expect(isValidAnonymousId(VALID_ID)).toBe(true);
    expect(isValidAnonymousId(crypto.randomUUID())).toBe(true);
  });

  it("rejects everything that is not exactly UUID-shaped", () => {
    expect(isValidAnonymousId("")).toBe(false);
    expect(isValidAnonymousId("visitor-123")).toBe(false);
    expect(isValidAnonymousId(`${VALID_ID}; Domain=evil.example`)).toBe(false);
    expect(isValidAnonymousId(`${VALID_ID}extra`)).toBe(false);
  });
});

describe("buildAnonymousIdSetCookie", () => {
  it("builds a one-year, Lax, Secure cookie by default", () => {
    expect(buildAnonymousIdSetCookie({ cookieName: COOKIE_NAME, id: VALID_ID })).toBe(
      `${COOKIE_NAME}=${VALID_ID}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`,
    );
  });

  it("honors a custom max-age", () => {
    expect(buildAnonymousIdSetCookie({ cookieName: COOKIE_NAME, id: VALID_ID, maxAgeSeconds: 60 })).toContain(
      "Max-Age=60",
    );
  });

  it("throws instead of echoing a non-UUID id into the header", () => {
    expect(() =>
      buildAnonymousIdSetCookie({ cookieName: COOKIE_NAME, id: `${VALID_ID}; Domain=evil.example` }),
    ).toThrow(/anonymous id/i);
  });

  it("throws on an invalid cookie name", () => {
    expect(() => buildAnonymousIdSetCookie({ cookieName: "bad=name", id: VALID_ID })).toThrow(/cookie name/i);
  });
});

describe("buildClearAnonymousIdSetCookie", () => {
  it("expires the cookie immediately", () => {
    expect(buildClearAnonymousIdSetCookie(COOKIE_NAME)).toBe(
      `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; Secure`,
    );
  });

  it("throws on an invalid cookie name", () => {
    expect(() => buildClearAnonymousIdSetCookie("bad name")).toThrow(/cookie name/i);
  });
});
