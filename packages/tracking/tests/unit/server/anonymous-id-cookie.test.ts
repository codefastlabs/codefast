import { describe, expect, it } from "vitest";

import {
  isValidAnonymousId,
  resolveAnonymousIdCookie,
  resolveClearAnonymousIdCookie,
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

describe("resolveAnonymousIdCookie", () => {
  it("resolves a one-year, Lax, Secure cookie by default", () => {
    expect(resolveAnonymousIdCookie({ cookieName: COOKIE_NAME, id: VALID_ID })).toEqual({
      maxAge: 31_536_000,
      name: COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: true,
      value: VALID_ID,
    });
  });

  it("honors a custom max-age", () => {
    expect(resolveAnonymousIdCookie({ cookieName: COOKIE_NAME, id: VALID_ID, maxAgeSeconds: 60 })).toMatchObject({
      maxAge: 60,
    });
  });

  it("throws instead of persisting a non-UUID id", () => {
    expect(() => resolveAnonymousIdCookie({ cookieName: COOKIE_NAME, id: `${VALID_ID}; Domain=evil.example` })).toThrow(
      /anonymous id/i,
    );
  });

  it("throws on an invalid cookie name", () => {
    expect(() => resolveAnonymousIdCookie({ cookieName: "bad=name", id: VALID_ID })).toThrow(/cookie name/i);
  });
});

describe("resolveClearAnonymousIdCookie", () => {
  it("resolves attributes matching the set path so the browser targets the same cookie", () => {
    expect(resolveClearAnonymousIdCookie(COOKIE_NAME)).toEqual({
      name: COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("throws on an invalid cookie name", () => {
    expect(() => resolveClearAnonymousIdCookie("bad name")).toThrow(/cookie name/i);
  });
});
