import type { BrowserContext, Page } from "playwright";

import { consentConfig } from "#/features/tracking/lib/consent";

/**
 * Seeds an accepted analytics decision into `localStorage` before any document loads.
 * Avoids the consent banner so tests don't pay a multi-second Accept wait.
 */
export async function seedAcceptedAnalyticsConsent(context: BrowserContext): Promise<void> {
  await context.addInitScript(
    ({ storageKey, policyVersion }) => {
      const record = {
        decision: { ads: false, analytics: true },
        policyVersion,
        timestamp: Date.now(),
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(record));
      } catch {
        /* private mode / quota — fall through to banner click */
      }
    },
    { storageKey: consentConfig.storageKey, policyVersion: consentConfig.policyVersion },
  );
}

/**
 * Accepts the analytics consent banner when present. Instant no-op when seeded /
 * already decided — uses a visibility check, never a multi-second waitFor timeout.
 */
export async function acceptConsentIfNeeded(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: "Accept" });

  if (!(await accept.isVisible())) {
    return;
  }

  await accept.click();
  await accept.waitFor({ state: "hidden", timeout: 5_000 });
}
