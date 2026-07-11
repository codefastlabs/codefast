import type { ComponentProps, ReactNode } from "react";

import type { GtagConsentBootstrapOptions } from "#/destinations/google-analytics";
import { buildGtagConsentBootstrapScript } from "#/destinations/google-analytics";

/**
 * @since 1.0.0-canary.6
 */
export interface GtagConsentBootstrapProps
  extends
    Omit<ComponentProps<"script">, "children" | "dangerouslySetInnerHTML" | "nonce" | "src" | "type">,
    GtagConsentBootstrapOptions {}

/**
 * Framework-agnostic inline `<script>` that runs `buildGtagConsentBootstrapScript` before
 * hydration. Pass the same `nonce` here and in `loadGtagScript` for CSP; this component
 * only sets the attribute on the host script — the generated source also stamps it onto
 * the injected gtag.js tag when `nonce` is provided.
 *
 * @since 1.0.0-canary.6
 */
export function GtagConsentBootstrap({
  config,
  dataLayerName,
  defaultConsent,
  debugMode,
  gaMeasurementId,
  nonce,
  ...props
}: GtagConsentBootstrapProps): ReactNode {
  const bootstrapOptions: GtagConsentBootstrapOptions = {
    config,
    defaultConsent,
    gaMeasurementId,
    ...(dataLayerName === undefined ? {} : { dataLayerName }),
    ...(debugMode === undefined ? {} : { debugMode }),
    ...(nonce === undefined ? {} : { nonce }),
  };

  return (
    <script
      {...props}
      dangerouslySetInnerHTML={{ __html: buildGtagConsentBootstrapScript(bootstrapOptions) }}
      {...(nonce === undefined ? {} : { nonce })}
      suppressHydrationWarning
    />
  );
}
