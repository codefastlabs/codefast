import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import type { ConsentCategory, ConsentDecision } from "#/core/consent";
import { CONSENT_CATEGORIES } from "#/core/consent";
import type { UseConsentResult } from "#/react/use-consent";

interface ConsentBannerContextValue {
  consent: UseConsentResult;
  /** The in-progress per-category selection — `undefined` while the preferences layer is closed. */
  pending: ConsentDecision | undefined;
  setPending: Dispatch<SetStateAction<ConsentDecision | undefined>>;
}

const ConsentBannerContext = createContext<ConsentBannerContextValue | null>(null);

function useConsentBannerContext(part: string): ConsentBannerContextValue {
  const context = useContext(ConsentBannerContext);

  if (context === null) {
    throw new Error(`\`${part}\` must be rendered inside \`ConsentBanner\``);
  }

  return context;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ConsentBannerProps extends ComponentProps<"section"> {
  consent: UseConsentResult;
  /** Overrides the default `needsPrompt` gating — e.g. to reopen the banner as a settings panel. */
  open?: boolean | undefined;
}

/**
 * Non-blocking opt-in prompt for GDPR/PDPL (VN) regions, as composable parts — the root owns
 * the visibility gating and the preferences-layer state; the `Accept`/`Reject`/`Customize`/
 * `Save` parts wire their own clicks to the consent hook, so any markup (including a
 * design system's button styles via `className`) slots in. Renders nothing once a decision
 * exists or the region defaults to opt-out (`consent.needsPrompt`), unless `open` says
 * otherwise. Rendered as a labeled region, not a `<dialog>`: an open non-modal dialog
 * neither traps focus nor blocks the page, so the dialog semantics would over-promise.
 * Unstyled by default — style via `className`/`data-slot` selectors, or import the
 * optional `@codefast/tracking/css/consent.css` theme. `data-state` on the root flips
 * between `prompt` and `preferences` for state-dependent styling.
 *
 * @since 0.5.0-canary.4
 */
export function ConsentBanner({ children, consent, open, ...props }: ConsentBannerProps): ReactNode {
  const [pending, setPending] = useState<ConsentDecision | undefined>(undefined);

  const isVisible = open ?? consent.needsPrompt;

  // Closing must reset the layer — a reopened banner starts at the prompt, not mid-preferences.
  useEffect(() => {
    if (!isVisible) {
      setPending(undefined);
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <ConsentBannerContext.Provider value={{ consent, pending, setPending }}>
      <section
        aria-label="Cookie consent"
        data-slot="consent-banner"
        data-state={pending === undefined ? "prompt" : "preferences"}
        {...props}
      >
        {children}
      </section>
    </ConsentBannerContext.Provider>
  );
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerTitleProps extends ComponentProps<"h2"> {}

/**
 * @since 0.5.0-canary.5
 */
export function ConsentBannerTitle({ children, ...props }: ConsentBannerTitleProps): ReactNode {
  return (
    <h2 data-slot="consent-title" {...props}>
      {children}
    </h2>
  );
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerDescriptionProps extends ComponentProps<"p"> {}

/**
 * Hosts the message and the privacy-policy link informed consent requires.
 *
 * @since 0.5.0-canary.5
 */
export function ConsentBannerDescription(props: ConsentBannerDescriptionProps): ReactNode {
  return <p data-slot="consent-description" {...props} />;
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerActionsProps extends ComponentProps<"div"> {}

/**
 * @since 0.5.0-canary.5
 */
export function ConsentBannerActions(props: ConsentBannerActionsProps): ReactNode {
  return <div data-slot="consent-actions" {...props} />;
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerAcceptProps extends Omit<ComponentProps<"button">, "type"> {}

/**
 * Grants the categories the app requested (`useConsent`'s `categories`) — never more.
 *
 * @since 0.5.0-canary.5
 */
export function ConsentBannerAccept({ onClick, ...props }: ConsentBannerAcceptProps): ReactNode {
  const { consent, setPending } = useConsentBannerContext("ConsentBannerAccept");

  return (
    <button
      data-action="accept"
      data-slot="consent-action"
      {...props}
      // the part owns the decision — composed so a consumer onClick (e.g. closing a settings view) still runs
      onClick={(event) => {
        onClick?.(event);
        consent.grantAll();
        setPending(undefined);
      }}
      type="button"
    />
  );
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerRejectProps extends Omit<ComponentProps<"button">, "type"> {}

/**
 * @since 0.5.0-canary.5
 */
export function ConsentBannerReject({ onClick, ...props }: ConsentBannerRejectProps): ReactNode {
  const { consent, setPending } = useConsentBannerContext("ConsentBannerReject");

  return (
    <button
      data-action="reject"
      data-slot="consent-action"
      {...props}
      // the part owns the decision — composed so a consumer onClick (e.g. closing a settings view) still runs
      onClick={(event) => {
        onClick?.(event);
        consent.denyAll();
        setPending(undefined);
      }}
      type="button"
    />
  );
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerCustomizeProps extends Omit<ComponentProps<"button">, "type"> {}

/**
 * Opens the per-category preferences layer, starting from the current effective state so
 * nothing arrives pre-ticked in an opt-in region (pre-ticked consent is invalid under
 * GDPR). Hidden while the layer is open — `ConsentBannerSave` takes over.
 *
 * @since 0.5.0-canary.5
 */
export function ConsentBannerCustomize({ onClick, ...props }: ConsentBannerCustomizeProps): ReactNode {
  const { consent, pending, setPending } = useConsentBannerContext("ConsentBannerCustomize");

  if (pending !== undefined) {
    return null;
  }

  return (
    <button
      data-action="customize"
      data-slot="consent-action"
      {...props}
      // the part owns the layer toggle — composed so a consumer onClick still runs
      onClick={(event) => {
        onClick?.(event);
        setPending(consent.effectiveConsent);
      }}
      type="button"
    />
  );
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerPreferencesProps extends ComponentProps<"div"> {}

/**
 * Container for the per-category rows — renders only while the preferences layer is open.
 *
 * @since 0.5.0-canary.5
 */
export function ConsentBannerPreferences(props: ConsentBannerPreferencesProps): ReactNode {
  const { pending } = useConsentBannerContext("ConsentBannerPreferences");

  if (pending === undefined) {
    return null;
  }

  return <div data-slot="consent-preferences" {...props} />;
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerCategoryProps extends ComponentProps<"label"> {
  category: ConsentCategory;
}

/**
 * One checkbox row of the preferences layer — `children` is the visitor-facing wording.
 *
 * @since 0.5.0-canary.5
 */
export function ConsentBannerCategory({ category, children, ...props }: ConsentBannerCategoryProps): ReactNode {
  const { pending, setPending } = useConsentBannerContext("ConsentBannerCategory");

  if (pending === undefined) {
    return null;
  }

  return (
    <label data-slot="consent-category" {...props}>
      <input
        checked={pending[category]}
        data-slot="consent-category-checkbox"
        onChange={(event) => {
          setPending({ ...pending, [category]: event.target.checked });
        }}
        type="checkbox"
      />
      {children}
    </label>
  );
}

/**
 * @since 0.5.0-canary.5
 */
export interface ConsentBannerSaveProps extends Omit<ComponentProps<"button">, "type"> {}

/**
 * Persists the pending per-category selection — renders only while the preferences layer is open.
 *
 * @since 0.5.0-canary.5
 */
export function ConsentBannerSave({ onClick, ...props }: ConsentBannerSaveProps): ReactNode {
  const { consent, pending, setPending } = useConsentBannerContext("ConsentBannerSave");

  if (pending === undefined) {
    return null;
  }

  return (
    <button
      data-action="save"
      data-slot="consent-action"
      {...props}
      // the part owns the decision — composed so a consumer onClick still runs
      onClick={(event) => {
        onClick?.(event);
        consent.save(pending);
        setPending(undefined);
      }}
      type="button"
    />
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
