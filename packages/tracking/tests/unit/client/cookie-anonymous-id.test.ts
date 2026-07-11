import { afterEach, describe, expect, it, vi } from "vitest";

import { createCookieAnonymousId } from "#/client/cookie-anonymous-id";

const COOKIE_NAME = "test-anon-id";

afterEach(() => {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${COOKIE_NAME}-extra=; path=/; max-age=0`;
  vi.restoreAllMocks();
});

describe("createCookieAnonymousId", () => {
  it("mints and persists a new id on first getOrCreate", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    const id = anonymousId.getOrCreate();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(document.cookie).toContain(`${COOKIE_NAME}=${id}`);
  });

  it("returns the same id on every subsequent getOrCreate", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    const first = anonymousId.getOrCreate();
    const second = anonymousId.getOrCreate();

    expect(first).toBe(second);
  });

  it("mints a fresh id after clear", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    const first = anonymousId.getOrCreate();

    anonymousId.clear();

    expect(document.cookie).not.toContain(COOKIE_NAME);

    const second = anonymousId.getOrCreate();

    expect(second).not.toBe(first);
  });

  it("mints a fresh id when the cookie was cleared externally without clear()", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });
    const first = anonymousId.getOrCreate();

    // Another tab's withdrawal expires the shared cookie but cannot call this instance's clear().
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;

    const second = anonymousId.getOrCreate();

    expect(second).not.toBe(first);
    expect(document.cookie).toContain(`${COOKIE_NAME}=${second}`);
  });

  it("two instances sharing a cookie name resolve to the same id", () => {
    const first = createCookieAnonymousId({ cookieName: COOKIE_NAME });
    const second = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    expect(second.getOrCreate()).toBe(first.getOrCreate());
  });

  it("matches the cookie name exactly — a longer prefix sibling is ignored", () => {
    document.cookie = `${COOKIE_NAME}-extra=sibling-id; path=/; max-age=3600; samesite=lax`;

    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });
    const id = anonymousId.getOrCreate();

    expect(id).not.toBe("sibling-id");
    expect(document.cookie).toContain(`${COOKIE_NAME}=${id}`);
  });

  it("sets the Secure attribute when the page is served over HTTPS", () => {
    const cookieSetter = vi.fn();

    vi.stubGlobal("location", { protocol: "https:" });
    vi.spyOn(document, "cookie", "set").mockImplementation(cookieSetter);
    vi.spyOn(document, "cookie", "get").mockReturnValue("");

    createCookieAnonymousId({ cookieName: COOKIE_NAME }).getOrCreate();

    expect(cookieSetter).toHaveBeenCalledWith(expect.stringMatching(/; secure$/i));

    vi.unstubAllGlobals();
  });
});
