import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

import type { ConsentCategory, ConsentDecision } from "#/core/consent";
import { CONSENT_CATEGORIES } from "#/core/consent";
import type { UseConsentResult } from "#/react/use-consent";

/**
 * One row of the preferences layer — the visitor-facing wording for a consent category.
 *
 * @since 0.5.0-canary.4
 */
export interface ConsentCategoryOption {
  category: ConsentCategory;
  description?: string;
  label: string;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ConsentBannerProps extends Omit<ComponentProps<"section">, "children"> {
  acceptLabel?: string;
  /** Enables the per-category preferences layer; omit to keep the two-button banner. */
  categories?: ReadonlyArray<ConsentCategoryOption>;
  consent: UseConsentResult;
  customizeLabel?: string;
  /** A node, not just a string — informed consent needs the privacy-policy link inside the message. */
  message?: ReactNode;
  rejectLabel?: string;
  saveLabel?: string;
}

/**
 * Non-blocking opt-in prompt for GDPR/NĐ 13 regions — renders nothing once a decision
 * exists or the region defaults to opt-out (`consent.needsPrompt` covers both). Accept
 * grants only the categories the app requested (`useConsent`'s `categories`), and the
 * optional `categories` prop adds a second layer of per-category checkboxes — GDPR
 * consent must be granular per purpose, not a single yes/no. Rendered as a labeled
 * region, not a `<dialog>`: an open non-modal dialog neither traps focus nor blocks the
 * page, so the dialog semantics would over-promise. No styling is baked in — target the
 * root via `className` and the parts via their `data-slot` attributes (`consent-message`,
 * `consent-actions`, `consent-action`, `consent-preferences`, `consent-category`).
 *
 * @since 0.5.0-canary.4
 */
export function ConsentBanner({
  acceptLabel = "Accept",
  categories,
  consent,
  customizeLabel = "Customize",
  message = "We use cookies to understand how you use this site.",
  rejectLabel = "Reject",
  saveLabel = "Save preferences",
  ...props
}: ConsentBannerProps): ReactNode {
  // The pending per-category selection — `undefined` while the preferences layer is closed.
  const [pending, setPending] = useState<ConsentDecision | undefined>(undefined);

  if (!consent.needsPrompt) {
    return null;
  }

  return (
    <section aria-label="Cookie consent" data-slot="consent-banner" {...props}>
      <p data-slot="consent-message">{message}</p>
      {pending !== undefined && categories !== undefined ? (
        <div data-slot="consent-preferences">
          {categories.map((option) => (
            <label data-slot="consent-category" key={option.category}>
              <input
                checked={pending[option.category]}
                data-slot="consent-category-checkbox"
                onChange={(event) => {
                  setPending({ ...pending, [option.category]: event.target.checked });
                }}
                type="checkbox"
              />
              <span data-slot="consent-category-label">{option.label}</span>
              {option.description === undefined ? null : (
                <span data-slot="consent-category-description">{option.description}</span>
              )}
            </label>
          ))}
        </div>
      ) : null}
      <div data-slot="consent-actions">
        {pending === undefined ? (
          <>
            <button data-action="accept" data-slot="consent-action" onClick={consent.grantAll} type="button">
              {acceptLabel}
            </button>
            <button data-action="reject" data-slot="consent-action" onClick={consent.denyAll} type="button">
              {rejectLabel}
            </button>
            {categories !== undefined && categories.length > 0 ? (
              <button
                data-action="customize"
                data-slot="consent-action"
                onClick={() => {
                  // Starts from the current effective state — all-denied in opt-in regions,
                  // so no box arrives pre-ticked (pre-ticked consent is invalid under GDPR).
                  setPending(consent.effectiveConsent);
                }}
                type="button"
              >
                {customizeLabel}
              </button>
            ) : null}
          </>
        ) : (
          <button
            data-action="save"
            data-slot="consent-action"
            onClick={() => {
              consent.save(pending);
            }}
            type="button"
          >
            {saveLabel}
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * @since 0.5.0-canary.4
 */
export interface ConsentToggleProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "type"> {
  allowLabel?: string;
  consent: UseConsentResult;
  denyLabel?: string;
}

/**
 * Always-visible control for opt-out regions — CCPA/CPRA requires a persistent
 * "Do Not Sell or Share My Personal Information" mechanism, not just a one-time prompt.
 * Flips between denying everything and re-granting the app's requested categories.
 *
 * @since 0.5.0-canary.4
 */
export function ConsentToggle({
  allowLabel = "Allow tracking",
  consent,
  denyLabel = "Do Not Sell or Share My Personal Information",
  ...props
}: ConsentToggleProps): ReactNode {
  const anyAllowed = CONSENT_CATEGORIES.some((category) => consent.effectiveConsent[category]);

  return (
    <button
      data-slot="consent-toggle"
      {...props}
      // the toggle owns its click — flipping the stored decision is its whole purpose
      onClick={anyAllowed ? consent.denyAll : consent.grantAll}
      type="button"
    >
      {anyAllowed ? denyLabel : allowLabel}
    </button>
  );
}
