import type { ConsentCategory } from "#/core/consent";

/**
 * The consent constants every surface must agree on. The React hooks, the client
 * tracker gate, the pre-hydration tag bootstraps, and the server cookie reader all
 * accept this object, so the cross-surface "must match" contracts hold by construction
 * instead of by hand-threading the same strings through every call site.
 */
export interface ConsentConfig {
  /**
   * Cookie the client mirrors decisions into so server-owned tracking can honor them —
   * written by `withConsentCookieMirror`, read by `readConsentDecisionCookie`. Omit when
   * the app tracks nothing server-side.
   */
  decisionCookieName?: string | undefined;
  /** Bumping re-prompts every visitor — a stored decision under any other version is ignored. */
  policyVersion: string;
  /** Purposes the app's prompt asks about — `grantAll` and opt-out defaults grant exactly these. */
  requestedCategories: ReadonlyArray<ConsentCategory>;
  /** `localStorage` key holding the visitor's `ConsentRecord`. */
  storageKey: string;
}

/** Identity helper for declaring the config with inference — `defineEventCatalog`'s consent twin. */
export function defineConsentConfig<Config extends ConsentConfig>(config: Config): Config {
  return config;
}
