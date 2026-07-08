import { afterEach, describe, expect, it } from "vitest";

import { createCookieAnonymousId } from "#/client/cookie-anonymous-id";

const COOKIE_NAME = "test-anon-id";

afterEach(() => {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
});

describe("createCookieAnonymousId", () => {
  it("mints and persists a new id on first resolve", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    const id = anonymousId.resolve();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(document.cookie).toContain(`${COOKIE_NAME}=${id}`);
  });

  it("returns the same id on every subsequent resolve", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    const first = anonymousId.resolve();
    const second = anonymousId.resolve();

    expect(first).toBe(second);
  });

  it("mints a fresh id after clear", () => {
    const anonymousId = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    const first = anonymousId.resolve();

    anonymousId.clear();

    expect(document.cookie).not.toContain(COOKIE_NAME);

    const second = anonymousId.resolve();

    expect(second).not.toBe(first);
  });

  it("two instances sharing a cookie name resolve to the same id", () => {
    const first = createCookieAnonymousId({ cookieName: COOKIE_NAME });
    const second = createCookieAnonymousId({ cookieName: COOKIE_NAME });

    expect(second.resolve()).toBe(first.resolve());
  });
});
