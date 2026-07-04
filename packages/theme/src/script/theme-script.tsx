import type { JSX } from "react";

import { DEFAULT_COLOR_SCHEME, MEDIA, STORAGE_KEY } from "#/constants";
import { colorSchemes } from "#/types";
import type { ColorScheme } from "#/types";

/* JSON.stringify does not escape </script>, so we replace the three characters that
 * can form a closing tag: < > /. Unicode escapes are valid JS and safe in HTML. */
function toScriptSafe(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003C").replaceAll(">", "\\u003E").replaceAll("/", "\\u002F");
}

/* Derived once from schema + constants — inline script uses these to stay in sync */
const COLOR_SCHEME_REMOVE_ARGS = colorSchemes.map((s) => toScriptSafe(s)).join(",");
const COLOR_SCHEME_VALID_CHECK = colorSchemes.map((s) => `s===${toScriptSafe(s)}`).join("||");

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.3
 */
export type AppearanceScriptProps = {
  /**
   * Fallback preference when the storage entry is absent or unrecognised.
   * Defaults to {@link DEFAULT_COLOR_SCHEME}.
   */
  readonly colorScheme?: ColorScheme;
  /**
   * CSP nonce applied to the inline script element.
   */
  readonly nonce?: string;
  /**
   * `localStorage` key the script reads before first paint — a recognised value (`"light"`,
   * `"dark"`, or `"automatic"`) wins over `colorScheme`.
   * Defaults to {@link STORAGE_KEY}; pair with `<AppearanceProvider>` using the **same key**.
   */
  readonly storageKey?: string;
};

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

/**
 * Inline script that prevents Flash of Unstyled Content (FOUC).
 *
 * **Why this is needed:**
 * React hydration occurs after the browser has already painted the page.
 * Without this script, users would briefly see the wrong appearance before
 * React takes over and applies the correct one.
 *
 * **How it works:**
 * This script runs synchronously in the `<head>` before first paint:
 * 1. Reads the stored preference from `localStorage`, falling back to `colorScheme`
 * 2. Resolves 'automatic' to 'light' or 'dark' using `matchMedia()`
 * 3. Removes prior `light` / `dark` / `automatic` classes on `<html>` (SSR may
 *    have applied the wrong resolved class for `automatic`, e.g. default `dark`)
 * 4. Adds the resolved color scheme class and sets `color-scheme` for native controls
 * 5. Writes the *preference* to `data-appearance` so preference-aware UI (e.g. a 3-state toggle)
 *    can render the right state from CSS on first paint, without a hydration flash
 *
 * @example
 * ```tsx
 * // In __root.tsx (TanStack Start)
 * <head>
 *   <AppearanceScript />
 * </head>
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function AppearanceScript({
  nonce,
  storageKey = STORAGE_KEY,
  colorScheme = DEFAULT_COLOR_SCHEME,
}: AppearanceScriptProps): JSX.Element {
  // S2: toScriptSafe = JSON.stringify + escape <>/  so </script> cannot break out of the tag.
  // F1: The script reads localStorage before first paint so the stored preference applies
  // without FOUC; an absent or invalid entry falls back to fbt.
  const appearanceScript = `(function(){try{var sk=${toScriptSafe(storageKey)},fbt=${toScriptSafe(colorScheme)},s=localStorage.getItem(sk),theme=(${COLOR_SCHEME_VALID_CHECK})?s:fbt,resolvedTheme=theme;"automatic"===theme&&(resolvedTheme=window.matchMedia(${toScriptSafe(MEDIA)}).matches?"dark":"light"),document.documentElement.classList.remove(${COLOR_SCHEME_REMOVE_ARGS}),document.documentElement.classList.add(resolvedTheme),document.documentElement.style.colorScheme=resolvedTheme,document.documentElement.dataset.appearance=theme}catch(e){}})()`;
  const nonceProps = nonce === undefined ? {} : { nonce };

  return <script dangerouslySetInnerHTML={{ __html: appearanceScript }} suppressHydrationWarning {...nonceProps} />;
}
