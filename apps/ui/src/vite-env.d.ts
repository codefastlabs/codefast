/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (`G-XXXXXXXXXX`) — omit to skip loading gtag.js entirely. */
  readonly VITE_GA4_MEASUREMENT_ID?: string;
}
