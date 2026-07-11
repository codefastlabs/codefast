import { createLocalStorageConsentStorage } from "#/client/consent-storage";
import { hasGlobalPrivacyControlSignal } from "#/client/gpc";
import type { InitialConsentStore } from "#/client/initial-consent-store";
import { createInitialConsentStore } from "#/client/initial-consent-store";
import { createIsAnalyticsAllowed } from "#/client/is-analytics-allowed";
import type { ConsentStorage, InitialConsent } from "#/core/consent";
import type { ConsentConfig } from "#/core/consent-config";

/**
 * @since 1.0.0-canary.6
 */
export interface ConsentRuntimeOptions {
  config: ConsentConfig;
  /** Re-read per event so a GPC change applies without recreating the runtime. Defaults to the real navigator signal. */
  hasGlobalPrivacyControlSignal?: (() => boolean) | undefined;
  /**
   * `sessionStorage` key caching the resolved region default, so only the first page
   * load of a session pays the round trip — omit to resolve once per page load instead.
   */
  initialConsentSessionStorageKey?: string | undefined;
  /**
   * The per-visitor server lane — typically a server function wrapping
   * `resolveInitialConsentFromRequest`. Shared/CDN-cached HTML can carry nothing
   * region-specific, so this is the only place the region-correct default may come from.
   */
  resolveInitialConsent: () => Promise<InitialConsent>;
}

/**
 * The live client-side consent instances, all derived from one `ConsentConfig` — create
 * it once at module scope and every surface (banner hook, tracker gate, privacy page)
 * shares the same storage and region resolution by construction.
 *
 * @since 1.0.0-canary.6
 */
export interface ConsentRuntime {
  config: ConsentConfig;
  /**
   * Kicks off region resolution — single-flight and idempotent. Call it early (e.g. at
   * router creation, window-guarded) so the round trip overlaps hydration instead of
   * waiting for the first mount effect.
   */
  ensureInitialConsentResolved: () => void;
  /** Feed to `useInitialConsent` for the reactive region default. */
  initialConsentStore: InitialConsentStore;
  /** Non-React gate for `createClientTracker` — the same rule `useConsent` applies. */
  isAnalyticsAllowed: () => boolean;
  /** The one `ConsentStorage` instance every surface must share. */
  storage: ConsentStorage;
}

/**
 * Composes the client half of the consent lane from a single `ConsentConfig`:
 * `localStorage`-backed decision storage, the initial-consent store over the app's
 * server lane, and the non-React analytics gate wired to that store's resolved mode.
 *
 * @since 1.0.0-canary.6
 */
export function createConsentRuntime(options: ConsentRuntimeOptions): ConsentRuntime {
  const { config } = options;
  const storage = createLocalStorageConsentStorage(config.storageKey);
  const initialConsentStore = createInitialConsentStore({
    resolve: options.resolveInitialConsent,
    sessionStorageKey: options.initialConsentSessionStorageKey,
  });
  const isAnalyticsAllowed = createIsAnalyticsAllowed({
    config,
    getMode: () => initialConsentStore.getSnapshot().initialConsent.mode,
    hasGlobalPrivacyControlSignal: options.hasGlobalPrivacyControlSignal ?? hasGlobalPrivacyControlSignal,
    storage,
  });

  return {
    config,
    ensureInitialConsentResolved: initialConsentStore.ensureResolved,
    initialConsentStore,
    isAnalyticsAllowed,
    storage,
  };
}
