import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentGate } from "#/components/layout/consent-gate";
import { PrivacyChoices } from "#/components/privacy/privacy-choices";
import { getTracker } from "#/lib/tracking";

/**
 * End-to-end consent matrix over the real wiring: real `useSiteConsent`/`consent-state`,
 * the real tracker with its consent gate and lazy anonymous-id cookie, and the real GA
 * destination writing to `window.dataLayer`. Only the two external boundaries are faked:
 * Vercel's SDK (`track` spy) and the region header (`getRequestHeader`).
 */

const { getRequestHeader, vercelTrack } = vi.hoisted(() => ({
  getRequestHeader: vi.fn(),
  vercelTrack: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader }));
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null, track: vercelTrack }));

const ANON_COOKIE = "codefast-ui-anon-id";
const COPY_EVENT = { kind: "install-command", name: "button" } as const;
const GRANTED_PARAMS = {
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "granted",
};
const DENIED_PARAMS = { ...GRANTED_PARAMS, analytics_storage: "denied" };

function setRegion(country: string | undefined, hasGpcHeader = false): void {
  getRequestHeader.mockImplementation((name: string) => {
    if (name === "x-vercel-ip-country") {
      return country;
    }

    return name === "sec-gpc" && hasGpcHeader ? "1" : undefined;
  });
}

function readAnonymousIdCookie(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ANON_COOKIE}=`))
    ?.split("=")[1];
}

function gtagCalls(): Array<Array<unknown>> {
  return (window.dataLayer ?? []).map((entry) => [...(entry as IArguments)]);
}

beforeEach(() => {
  vercelTrack.mockClear();
  window.localStorage.clear();
  document.cookie = `${ANON_COOKIE}=; path=/; max-age=0`;
  delete window.dataLayer;
  delete window.gtag;
});

afterEach(() => {
  cleanup();
});

describe("consent × tracking matrix", () => {
  it("opt-in, undecided: shows the banner and drops events — no destination call, no anonymous-id cookie", () => {
    setRegion("DE");

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).not.toHaveBeenCalled();
    expect(readAnonymousIdCookie()).toBeUndefined();
  });

  it("opt-in → Accept: grants gtag consent, events reach both destinations, and the anonymous id is minted", async () => {
    setRegion("DE");

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).toHaveBeenCalledWith("copy_code", COPY_EVENT);
    expect(gtagCalls()).toContainEqual(["consent", "update", GRANTED_PARAMS]);
    expect(gtagCalls()).toContainEqual(["event", "copy_code", COPY_EVENT]);
    expect(readAnonymousIdCookie()).toBeTruthy();
  });

  it("opt-in → Reject: revokes gtag consent, keeps events blocked, and never creates the cookie", async () => {
    setRegion("DE");

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).not.toHaveBeenCalled();
    expect(gtagCalls()).toContainEqual(["consent", "update", DENIED_PARAMS]);
    expect(gtagCalls()).not.toContainEqual(["event", "copy_code", COPY_EVENT]);
    expect(readAnonymousIdCookie()).toBeUndefined();
  });

  it("withdrawing on the privacy page stops tracking everywhere and removes the anonymous id", async () => {
    setRegion("DE");

    const user = userEvent.setup();

    render(
      <>
        <ConsentGate />
        <PrivacyChoices />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Accept" }));

    getTracker().track("copy_code", COPY_EVENT);

    expect(readAnonymousIdCookie()).toBeTruthy();
    // what gtag.js would have set after the grant — withdrawal must sweep it away
    document.cookie = "_ga=GA1.1.451682940.1783475878; path=/";
    vercelTrack.mockClear();
    window.dataLayer = [];

    await user.click(screen.getByRole("switch", { name: "Allow analytics" }));

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).not.toHaveBeenCalled();
    expect(readAnonymousIdCookie()).toBeUndefined();
    expect(document.cookie).not.toContain("_ga=");
    // ConsentGate owns the gtag update — the privacy-page decision synced through the shared storage.
    expect(gtagCalls()).toEqual([["consent", "update", DENIED_PARAMS]]);
  });

  it("opt-out (US), undecided: no banner, tracking runs by default", () => {
    setRegion("US");

    render(<ConsentGate />);

    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    expect(screen.getByRole("button", { name: "Turn off analytics" })).toBeTruthy();

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).toHaveBeenCalledOnce();
    expect(readAnonymousIdCookie()).toBeTruthy();
  });

  it("opt-out: Turn off analytics stops tracking and removes the id; Turn on analytics re-enables both", async () => {
    setRegion("US");

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Turn off analytics" }));

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).not.toHaveBeenCalled();
    expect(readAnonymousIdCookie()).toBeUndefined();

    await user.click(screen.getByRole("button", { name: "Turn on analytics" }));

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).toHaveBeenCalledOnce();
    expect(readAnonymousIdCookie()).toBeTruthy();
  });

  it("opt-out with GPC: analytics measurement stays allowed — GPC is honored as an ads opt-out only", () => {
    setRegion("US", true);
    Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: true });

    try {
      render(<ConsentGate />);

      getTracker().track("copy_code", COPY_EVENT);

      expect(vercelTrack).toHaveBeenCalledOnce();
    } finally {
      Reflect.deleteProperty(navigator, "globalPrivacyControl");
    }
  });

  it("a grant stored under an older policy version re-prompts and blocks tracking again", () => {
    setRegion("DE");
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: { ads: false, analytics: true }, policyVersion: "0", timestamp: 0 }),
    );

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();

    getTracker().track("copy_code", COPY_EVENT);

    expect(vercelTrack).not.toHaveBeenCalled();
  });

  it("page views never reach Vercel as custom events — the native <Analytics /> component owns them", () => {
    setRegion("US");

    getTracker().page("/components", { href: "https://example.test/components" });

    expect(vercelTrack).not.toHaveBeenCalled();
  });
});
