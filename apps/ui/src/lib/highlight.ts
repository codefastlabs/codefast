/**
 * Shape of a `?shiki` module — a source file pre-highlighted at build time by
 * the Vite plugin in `vite.shiki.ts`. Replaces the old runtime Shiki
 * highlighter: consumers import these static strings instead of highlighting
 * per request.
 */
export interface HighlightedSource {
  /** Raw source text, written to the clipboard on copy. */
  readonly code: string;
  /** Pre-rendered Shiki HTML — dark theme (github-dark). */
  readonly htmlDark: string;
  /** Pre-rendered Shiki HTML — light theme (github-light). */
  readonly htmlLight: string;
}
