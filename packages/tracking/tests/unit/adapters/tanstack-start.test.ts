import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAnonymousIdResponseCookie,
  recordConsentReceiptFromRequest,
  resolveInitialConsentFromRequest,
  setAnonymousIdResponseCookie,
} from "#/adapters/tanstack-start";
import type { ConsentReceiptInput } from "#/core/consent-receipt";
import type { ReceiptStore } from "#/server/consent-receipt-store";

const { deleteCookie, getRequestHeader, getRequestIP, setCookie, setResponseHeader } = vi.hoisted(() => ({
  deleteCookie: vi.fn<(name: string, options?: unknown) => void>(),
  getRequestHeader: vi.fn<(name: string) => string | undefined>(),
  getRequestIP: vi.fn<() => string | undefined>(),
  setCookie: vi.fn<(name: string, value: string, options?: unknown) => void>(),
  setResponseHeader: vi.fn<(name: string, value: string) => void>(),
}));

vi.mock("@tanstack/react-start/server", () => ({
  deleteCookie,
  getRequestHeader,
  getRequestIP,
  setCookie,
  setResponseHeader,
}));

const ANON_ID = "11111111-1111-4111-8111-111111111111";

const VALID_RECEIPT_INPUT: ConsentReceiptInput = {
  decision: { ads: false, analytics: true },
  eventType: "give",
  method: "granular",
  noticeLanguage: "en",
  noticeVersion: "1",
  policyVersion: "1",
  subjectId: ANON_ID,
  subjectIdType: "cookie",
};

function stubHeaders(headers: Record<string, string>): void {
  getRequestHeader.mockImplementation((name: string) => headers[name]);
}

beforeEach(() => {
  getRequestHeader.mockReset();
  setResponseHeader.mockReset();
  setCookie.mockReset();
  deleteCookie.mockReset();
  getRequestIP.mockReset();
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
  it("persists a UUID-shaped id via the framework's setCookie (append-safe, not a raw header)", () => {
    setAnonymousIdResponseCookie({ cookieName: "anon-id", id: ANON_ID });

    expect(setCookie).toHaveBeenCalledWith("anon-id", ANON_ID, {
      maxAge: 31_536_000,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(setResponseHeader).not.toHaveBeenCalled();
  });

  it("throws on a non-UUID id instead of writing it to a cookie", () => {
    expect(() => {
      setAnonymousIdResponseCookie({ cookieName: "anon-id", id: "evil\r\nSet-Cookie: pwned=1" });
    }).toThrow("Invalid anonymous id: expected a UUID-shaped value");
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("expires the cookie on clear via deleteCookie with matching attributes", () => {
    clearAnonymousIdResponseCookie("anon-id");

    expect(deleteCookie).toHaveBeenCalledWith("anon-id", { path: "/", sameSite: "lax", secure: true });
  });
});

describe("recordConsentReceiptFromRequest", () => {
  function fakeStore(): { append: ReturnType<typeof vi.fn>; store: ReceiptStore } {
    const append = vi.fn<(receipt: unknown) => Promise<void>>(() => Promise.resolve());

    return { append, store: { append } as unknown as ReceiptStore };
  }

  it("appends a coarsened-IP receipt, stamps no-store, and returns a PII-free ack", async () => {
    getRequestIP.mockReturnValue("203.0.113.7");
    const { append, store } = fakeStore();

    const ack = await recordConsentReceiptFromRequest({ input: VALID_RECEIPT_INPUT, store });

    expect(setResponseHeader).toHaveBeenCalledWith("cache-control", "no-store");
    expect(getRequestIP).toHaveBeenCalledWith({ xForwardedFor: true });
    expect(append).toHaveBeenCalledOnce();
    const stored = append.mock.calls[0]?.[0] as { ipCoarse?: string; subjectId: string };
    expect(stored.ipCoarse).toBe("203.0.0.0");
    // The ack carries only the receipt id + timestamp — never the stored subjectId/ipCoarse.
    expect(Object.keys(ack).sort()).toEqual(["receiptId", "timestamp"]);
    expect(ack.receiptId).toEqual(expect.any(String));
  });

  it("rejects a body-supplied IP without appending or leaking it", async () => {
    const { append, store } = fakeStore();

    // A malicious body carries an ipCoarse the type forbids — the runtime guard must reject it.
    const bodyWithIp = { ...VALID_RECEIPT_INPUT, ipCoarse: "1.2.0.0" } as ConsentReceiptInput;

    await expect(recordConsentReceiptFromRequest({ input: bodyWithIp, store })).rejects.toThrow(
      "Invalid consent receipt input",
    );
    expect(append).not.toHaveBeenCalled();
  });
});
