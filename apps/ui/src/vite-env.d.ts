/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (`G-XXXXXXXXXX`) — omit to skip loading gtag.js entirely. */
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  /** Google Ads conversion `send_to` value (`AW-XXXXXXXXX/AbCdEfGhIjK`) for the `copy_code` event. */
  readonly VITE_GOOGLE_ADS_SEND_TO?: string;
}
