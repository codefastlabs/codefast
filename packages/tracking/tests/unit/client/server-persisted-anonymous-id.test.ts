import { afterEach, describe, expect, it, vi } from "vitest";

import { createServerPersistedAnonymousId } from "#/client/server-persisted-anonymous-id";

const COOKIE_NAME = "test-persisted-anon-id";

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

afterEach(() => {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  vi.restoreAllMocks();
});

describe("createServerPersistedAnonymousId", () => {
  it("mints an id, writes the cookie optimistically, and delegates persistence to the server", () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const anonymousId = createServerPersistedAnonymousId({ cookieName: COOKIE_NAME, persist });

    const id = anonymousId.getOrCreate();

    expect(document.cookie).toContain(`${COOKIE_NAME}=${id}`);
    expect(persist).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("re-persists an existing cookie so the server prolongs it past Safari ITP's cap", () => {
    document.cookie = `${COOKIE_NAME}=3b241101-e2bb-4255-8caf-4136c566a962; path=/; max-age=3600`;

    const persist = vi.fn().mockResolvedValue(undefined);
    const anonymousId = createServerPersistedAnonymousId({ cookieName: COOKIE_NAME, persist });

    expect(anonymousId.getOrCreate()).toBe("3b241101-e2bb-4255-8caf-4136c566a962");
    expect(persist).toHaveBeenCalledExactlyOnceWith("3b241101-e2bb-4255-8caf-4136c566a962");
  });

  it("persists at most once per page load, however many events fire", () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const anonymousId = createServerPersistedAnonymousId({ cookieName: COOKIE_NAME, persist });

    anonymousId.getOrCreate();
    anonymousId.getOrCreate();
    anonymousId.getOrCreate();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("survives a rejected persist — the id still resolves and no retry hammers the endpoint", async () => {
    const persist = vi.fn().mockRejectedValue(new Error("offline"));
    const anonymousId = createServerPersistedAnonymousId({ cookieName: COOKIE_NAME, persist });

    const id = anonymousId.getOrCreate();

    await flushMicrotasks();

    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(anonymousId.getOrCreate()).toBe(id);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("clear expires the cookie on both sides and re-persists the next minted id", async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const clearOnServer = vi.fn().mockResolvedValue(undefined);
    const anonymousId = createServerPersistedAnonymousId({ clearOnServer, cookieName: COOKIE_NAME, persist });

    const first = anonymousId.getOrCreate();

    anonymousId.clear();

    expect(document.cookie).not.toContain(COOKIE_NAME);
    expect(clearOnServer).toHaveBeenCalledTimes(1);

    const second = anonymousId.getOrCreate();

    expect(second).not.toBe(first);
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenLastCalledWith(second);
  });

  it("skips clearOnServer when the cookie is already gone", () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const clearOnServer = vi.fn().mockResolvedValue(undefined);
    const anonymousId = createServerPersistedAnonymousId({ clearOnServer, cookieName: COOKIE_NAME, persist });

    anonymousId.getOrCreate();
    anonymousId.clear();
    clearOnServer.mockClear();

    anonymousId.clear();

    expect(clearOnServer).not.toHaveBeenCalled();
  });

  it("re-persists after an external cookie clear without an explicit clear() call", () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const anonymousId = createServerPersistedAnonymousId({ cookieName: COOKIE_NAME, persist });
    const first = anonymousId.getOrCreate();

    expect(persist).toHaveBeenCalledTimes(1);

    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;

    const second = anonymousId.getOrCreate();

    expect(second).not.toBe(first);
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenLastCalledWith(second);
  });

  it("survives a rejected clearOnServer — the client-side expiry already took effect", async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const clearOnServer = vi.fn().mockRejectedValue(new Error("offline"));
    const anonymousId = createServerPersistedAnonymousId({ clearOnServer, cookieName: COOKIE_NAME, persist });

    anonymousId.getOrCreate();
    anonymousId.clear();

    await flushMicrotasks();

    expect(document.cookie).not.toContain(COOKIE_NAME);
  });
});
