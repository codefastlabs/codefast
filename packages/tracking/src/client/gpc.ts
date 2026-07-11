interface NavigatorWithGpc extends Navigator {
  globalPrivacyControl?: boolean | undefined;
}

/**
 * Global Privacy Control isn't in lib.dom yet, hence the local interface extension.
 * CCPA/CPRA requires honoring this as an opt-out signal even under the opt-out default.
 * Guarded so SSR renders (where the module is reachable) read `false`, not a crash on
 * runtimes without a global `navigator`.
 *
 * @since 0.5.0-canary.4
 */
export function hasGlobalPrivacyControlSignal(): boolean {
  return typeof navigator !== "undefined" && (navigator as NavigatorWithGpc).globalPrivacyControl === true;
}
