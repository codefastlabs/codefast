import type { Page } from "playwright";
import { expect } from "vitest";

import type { track } from "#/features/tracking/lib/tracking";
import { isGaMeasurementIdConfigured } from "#/tests/e2e/support/app-env";

/** Catalog event names — keeps e2e assertions aligned with the production catalog. */
export type CatalogEventName = Parameters<typeof track>[0];

/** One captured custom analytics event (metadata-only props). */
export interface CapturedTrackingEvent {
  name: string;
  properties: Record<string, unknown>;
  source: "gtag" | "vercel";
}

declare global {
  interface Window {
    __e2eClientReady?: boolean;
    __e2eTrackingEvents?: Array<CapturedTrackingEvent>;
  }
}

type VercelAnalyticsFn = NonNullable<Window["va"]>;
type VercelAnalyticsArgs = Parameters<VercelAnalyticsFn>;

/**
 * Installs page probes that record custom events from both destinations: wraps
 * `window.va` (Vercel Analytics queue) and `gtag` once the Consent Mode bootstrap
 * mounts it. Local `apps/ui/.env.local` typically sets `VITE_GA4_MEASUREMENT_ID`
 * so both fire; CI without that file still asserts on `va` alone.
 *
 * Sets `window.__e2eClientReady` when Vercel Analytics replaces `window.va` — a
 * reliable signal that client JS has hydrated past SSR chrome (which is visible
 * before click handlers exist).
 */
export async function installTrackingProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const events: Array<CapturedTrackingEvent> = [];
    window.__e2eTrackingEvents = events;
    window.__e2eClientReady = false;

    const captureVercel = (...params: VercelAnalyticsArgs): void => {
      if (params[0] !== "event") {
        return;
      }

      const payload = params[1];

      if (payload === null || typeof payload !== "object" || !("name" in payload)) {
        return;
      }

      const name = (payload as { name?: unknown }).name;

      if (typeof name !== "string") {
        return;
      }

      const data = (payload as { data?: unknown }).data;
      events.push({
        name,
        properties: data !== null && typeof data === "object" ? (data as Record<string, unknown>) : {},
        source: "vercel",
      });
    };

    let vaImpl: VercelAnalyticsFn = (...params) => {
      captureVercel(...params);
      window.vaq ??= [];
      window.vaq.push(params);
    };

    Object.defineProperty(window, "va", {
      configurable: true,
      get() {
        return vaImpl;
      },
      set(next: VercelAnalyticsFn) {
        window.__e2eClientReady = true;
        vaImpl = (...params) => {
          captureVercel(...params);
          return next(...params);
        };
      },
    });

    const wrapGtag = (): void => {
      const current = window.gtag;

      if (typeof current !== "function" || (current as { __e2e?: boolean }).__e2e) {
        return;
      }

      const wrapped = ((...args: Array<unknown>) => {
        if (args[0] === "event" && typeof args[1] === "string") {
          const properties =
            args[2] !== null && typeof args[2] === "object" ? (args[2] as Record<string, unknown>) : {};
          events.push({ name: args[1], properties, source: "gtag" });
        }

        return current(...(args as Parameters<NonNullable<Window["gtag"]>>));
      }) as NonNullable<Window["gtag"]> & { __e2e: boolean };

      wrapped.__e2e = true;
      window.gtag = wrapped;
    };

    wrapGtag();
    const intervalId = window.setInterval(wrapGtag, 25);
    window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 15_000);
  });
}

/** Waits until Vercel Analytics has mounted — client handlers are safe to click. */
export async function waitForClientReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__e2eClientReady === true, { timeout: 10_000 });
}

/** Snapshot of events captured in the page since navigation / last clear. */
export async function readCapturedEvents(page: Page): Promise<Array<CapturedTrackingEvent>> {
  return page.evaluate(() => [...(window.__e2eTrackingEvents ?? [])]);
}

export async function clearCapturedEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__e2eTrackingEvents ??= [];
    window.__e2eTrackingEvents.length = 0;
  });
}

export function findEvents(
  events: ReadonlyArray<CapturedTrackingEvent>,
  name: CatalogEventName,
  source?: CapturedTrackingEvent["source"],
): Array<CapturedTrackingEvent> {
  return events.filter((event) => event.name === name && (source === undefined || event.source === source));
}

/**
 * Asserts a tracked event by name + props. Always requires a Vercel (`va`) capture.
 * When `VITE_GA4_MEASUREMENT_ID` is set (process env or `apps/ui/.env.local`), also
 * requires a matching `gtag` capture — local runs have `.env.local`; CI without it
 * stays vercel-only so the suite still passes.
 */
export function expectTrackedEvent(
  events: ReadonlyArray<CapturedTrackingEvent>,
  name: CatalogEventName,
  properties: Record<string, unknown>,
): CapturedTrackingEvent {
  const matches = findEvents(events, name).filter((event) =>
    Object.entries(properties).every(([key, value]) => event.properties[key] === value),
  );

  const detail = `event "${name}" with ${JSON.stringify(properties)}, got: ${JSON.stringify(events, null, 2)}`;

  const vercel = matches.filter((event) => event.source === "vercel");
  expect(vercel, `Expected Vercel capture for ${detail}`).not.toHaveLength(0);

  if (isGaMeasurementIdConfigured()) {
    const gtag = matches.filter((event) => event.source === "gtag");
    expect(
      gtag,
      `Expected gtag capture (VITE_GA4_MEASUREMENT_ID is set via env / apps/ui/.env.local) for ${detail}`,
    ).not.toHaveLength(0);
  }

  return matches[matches.length - 1]!;
}
