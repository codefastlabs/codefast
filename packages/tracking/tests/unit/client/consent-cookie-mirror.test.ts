import { beforeEach, describe, expect, it } from "vitest";

import { withConsentCookieMirror } from "#/client/consent-cookie-mirror";
import { createLocalStorageConsentStorage } from "#/client/consent-storage";
import type { ConsentRecord } from "#/core/consent";
import { decodeConsentCookieValue } from "#/core/consent-cookie";
import { readCookieValue } from "#/core/cookie";

const record: ConsentRecord = {
  decision: { ads: false, analytics: true },
  policyVersion: "1",
  timestamp: 1_700_000_000_000,
};

function expireCookie(): void {
  document.cookie = "consent-mirror=; path=/; max-age=0";
}

describe("withConsentCookieMirror", () => {
  beforeEach(() => {
    window.localStorage.clear();
    expireCookie();
  });

  it("mirrors every save into the cookie the server reads", () => {
    const storage = withConsentCookieMirror(createLocalStorageConsentStorage("consent-mirror-test"), {
      cookieName: "consent-mirror",
    });

    storage.save(record);

    const raw = readCookieValue(document.cookie, "consent-mirror");

    expect(raw).toBeDefined();
    expect(decodeConsentCookieValue(raw ?? "")).toEqual(record);
    // localStorage stays the source of truth the UI reads
    expect(storage.load()).toEqual(record);
  });

  it("expires the cookie on clear", () => {
    const storage = withConsentCookieMirror(createLocalStorageConsentStorage("consent-mirror-test"), {
      cookieName: "consent-mirror",
    });

    storage.save(record);
    storage.clear();

    expect(readCookieValue(document.cookie, "consent-mirror")).toBeUndefined();
    expect(storage.load()).toBeUndefined();
  });

  it("forwards subscriptions to the wrapped storage", () => {
    const storage = withConsentCookieMirror(createLocalStorageConsentStorage("consent-mirror-test"), {
      cookieName: "consent-mirror",
    });
    let notified = 0;

    const unsubscribe = storage.subscribe(() => {
      notified += 1;
    });

    storage.save(record);
    unsubscribe();
    storage.save(record);

    expect(notified).toBe(1);
  });
});
