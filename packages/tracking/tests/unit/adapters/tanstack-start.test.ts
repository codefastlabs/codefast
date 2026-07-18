import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAnonymousIdResponseCookie,
  resolveInitialConsentFromRequest,
  setAnonymousIdResponseCookie,
} from "#/adapters/tanstack-start";

const { getRequestHeader, setResponseHeader } = vi.hoisted(() => ({
  getRequestHeader: vi.fn<(name: string) => string | undefined>(),
  setResponseHeader: vi.fn<(name: string, value: string) => void>(),
}));

vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader, setResponseHeader }));

const ANON_ID = "11111111-1111-4111-8111-111111111111";

function stubHeaders(headers: Record<string, string>): void {
  getRequestHeader.mockImplementation((name: string) => headers[name]);
}

beforeEach(() => {
  getRequestHeader.mockReset();
  setResponseHeader.mockReset();
  stubHeaders({});
});

describe("resolveInitialConsentFromRequest", () => {
  it("resolves the region from the geo header and stamps the per-visitor cache header", () => {
    stubHeaders({ "x-vercel-ip-country": "DE" });

    const consent = resolveInitialConsentFromRequest({ requestedCategories: ["analytics"] });

    expect(consent).toEqual({ defaultConsent: { ads: false, analytics: false }, mode: "opt-in", region: "eu" });
    expect(setResponseHeader).toHaveBeenCalledWith("cache-control", "private, no-store");
  });

  it("fails closed when the geo header is missing", () => {
    const consent = resolveInitialConsentFromRequest({ requestedCategories: ["analytics"] });

    expect(consent.mode).toBe("opt-in");
    expect(consent.defaultConsent).toEqual({ ads: false, analytics: false });
  });

  it("honors sec-gpc as an ads-only opt-out and a custom geo header name", () => {
    stubHeaders({ "cf-ipcountry": "US", "sec-gpc": "1" });

    const consent = resolveInitialConsentFromRequest({
      countryHeaderName: "cf-ipcountry",
      requestedCategories: ["ads", "analytics"],
    });

    expect(consent).toEqual({ defaultConsent: { ads: false, analytics: true }, mode: "opt-out", region: "us" });
  });
});

describe("anonymous-id response cookies", () => {
  it("persists a UUID-shaped id via Set-Cookie", () => {
    setAnonymousIdResponseCookie({ cookieName: "anon-id", id: ANON_ID });

    expect(setResponseHeader).toHaveBeenCalledWith(
      "set-cookie",
      `anon-id=${ANON_ID}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`,
    );
  });

  it("throws on a non-UUID id instead of echoing it into a header", () => {
    expect(() => {
      setAnonymousIdResponseCookie({ cookieName: "anon-id", id: "evil\r\nSet-Cookie: pwned=1" });
    }).toThrow("Invalid anonymous id: expected a UUID-shaped value");
    expect(setResponseHeader).not.toHaveBeenCalled();
  });

  it("expires the cookie on clear", () => {
    clearAnonymousIdResponseCookie("anon-id");

    expect(setResponseHeader).toHaveBeenCalledWith("set-cookie", "anon-id=; Path=/; Max-Age=0; SameSite=Lax; Secure");
  });
});
