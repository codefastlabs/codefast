import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

import { E2E_BASE_URL } from "#/tests/e2e/support/base-url";
import { acceptConsentIfNeeded, seedAcceptedAnalyticsConsent } from "#/tests/e2e/support/consent";
import { clearCapturedEvents, installTrackingProbe, waitForClientReady } from "#/tests/e2e/support/tracking-probe";

export interface TrackingBrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  baseUrl: string;
  /** After the first consent settle, later navigations skip the banner poll. */
  consentReady: boolean;
  /** After the first full load, SPA navigations skip `waitForClientReady`. */
  clientReady: boolean;
}

/** Third-party / media the tracking probe does not need — abort to cut network wait. */
const BLOCKED_URL =
  /googletagmanager\.com|google-analytics\.com|google\.com\/ccm|fonts\.googleapis\.com|fonts\.gstatic\.com|github\.com|chatgpt\.com|claude\.ai/iu;

const BLOCKED_RESOURCE_TYPES = new Set(["image", "media", "font"]);

/**
 * Launches one Chromium + context + page for the whole e2e file: clipboard permission,
 * tracking probe, blocked heavy third-party, and a pre-seeded analytics consent decision.
 */
export async function openTrackingSession(): Promise<TrackingBrowserSession> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-sync",
      "--no-first-run",
      "--mute-audio",
    ],
  });
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    // Desktop nav + gallery layout; tracking asserts on stubs, not pixels.
    reducedMotion: "reduce",
    serviceWorkers: "block",
    viewport: { width: 1280, height: 720 },
  });

  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();

    if (BLOCKED_URL.test(url) || BLOCKED_RESOURCE_TYPES.has(request.resourceType())) {
      return route.abort();
    }

    return route.continue();
  });

  await seedAcceptedAnalyticsConsent(context);

  const page = await context.newPage();
  await installTrackingProbe(page);

  return {
    baseUrl: E2E_BASE_URL,
    browser,
    context,
    page,
    clientReady: false,
    consentReady: false,
  };
}

/**
 * Full document load + client hydration. Prefer {@link spaNavigate} after the first call —
 * each `goto` re-pays Vite/SSR + `waitForClientReady`.
 */
export async function gotoWithConsent(session: TrackingBrowserSession, path: string): Promise<void> {
  const url = path.startsWith("http") ? path : new URL(path, session.baseUrl).toString();
  await session.page.goto(url, { waitUntil: "domcontentloaded" });
  // SSR chrome is visible before React handlers exist — wait for Analytics mount.
  await waitForClientReady(session.page);
  session.clientReady = true;

  if (!session.consentReady) {
    await acceptConsentIfNeeded(session.page);
    session.consentReady = true;
  }

  await clearCapturedEvents(session.page);
}

/**
 * In-app navigation without a full reload. Prefers an in-page `<a href>` click
 * (TanStack Router). Call only after {@link gotoWithConsent} has hydrated once.
 */
export async function spaNavigate(session: TrackingBrowserSession, path: string): Promise<void> {
  if (!session.clientReady) {
    await gotoWithConsent(session, path);
    return;
  }

  const href = path.startsWith("http") ? new URL(path).pathname + new URL(path).search + new URL(path).hash : path;

  // Prefer main nav when the path is a primary route — more reliable than a raw href scan.
  const navLabel =
    href === "/components" ? "Components" : href === "/about" ? "Getting Started" : href === "/" ? "Home" : undefined;

  if (navLabel) {
    await session.page
      .getByRole("navigation", { name: /Main navigation/i })
      .getByRole("link", { name: navLabel })
      .click();
  } else {
    await session.page.locator(`a[href='${href}']`).first().click();
  }

  await session.page.waitForURL(
    (url) => url.pathname + url.search + url.hash === href || url.pathname === href.split("#")[0],
  );
  await clearCapturedEvents(session.page);
}

export async function closeTrackingSession(session: TrackingBrowserSession): Promise<void> {
  await session.context.close();
  await session.browser.close();
}
