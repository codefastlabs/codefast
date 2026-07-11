interface NavigatorWithGpc extends Navigator {
  globalPrivacyControl?: boolean | undefined;
}

/**
 * Global Privacy Control isn't in lib.dom yet, hence the local interface extension.
 * CCPA/CPRA requires honoring this as an opt-out signal even under the opt-out default.
 *
 * @since 0.5.0-canary.4
 */
export function hasGlobalPrivacyControlSignal(): boolean {
  return (navigator as NavigatorWithGpc).globalPrivacyControl === true;
}
