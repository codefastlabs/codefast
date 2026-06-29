/**
 * A registry source resolved to raw text + pre-rendered Shiki HTML by
 * `getHighlightedSource`. Shipped as loader data — highlighted once at build, not
 * per request.
 */
export interface HighlightedSource {
  /** Raw source — copied to the clipboard. */
  readonly code: string;
  /** Dual-theme highlighted HTML (light inline + `--shiki-dark` var, themed by CSS). */
  readonly html: string;
}
