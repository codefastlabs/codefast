import type { JSX } from "react";

import { appearances } from "#/appearance";
import type { Appearance } from "#/appearance";
import { DEFAULT_APPEARANCE, MEDIA, STORAGE_KEY } from "#/constants";

/* JSON.stringify does not escape </script>, so we replace the three characters that
 * can form a closing tag: < > /. Unicode escapes are valid JS and safe in HTML. */
function toScriptSafe(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003C").replaceAll(">", "\\u003E").replaceAll("/", "\\u002F");
}

/* Derived once from schema + constants — the inline script uses these to stay in sync */
const APPEARANCE_REMOVE_ARGS = appearances.map((s) => toScriptSafe(s)).join(",");
const APPEARANCE_VALID_CHECK = appearances.map((s) => `s===${toScriptSafe(s)}`).join("||");

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

export type AppearanceScriptProps = {
  /**
   * Fallback preference when the storage entry is absent or unrecognised.
   * Defaults to {@link DEFAULT_APPEARANCE}.
   */
  readonly appearance?: Appearance;
  /**
   * CSP nonce applied to the inline script element.
   */
  readonly nonce?: string;
  /**
   * `localStorage` key the script reads before first paint — a recognised value (`"light"`,
   * `"dark"`, or `"automatic"`) wins over `appearance`.
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
 * 1. Reads the stored preference from `localStorage`, falling back to `appearance`
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
 */
export function AppearanceScript({
  nonce,
  storageKey = STORAGE_KEY,
  appearance = DEFAULT_APPEARANCE,
}: AppearanceScriptProps): JSX.Element {
  // toScriptSafe = JSON.stringify + escape <>/  so </script> cannot break out of the tag.
  // The script reads localStorage before first paint so the stored preference applies
  // without FOUC; an absent or invalid entry falls back to fb.
  const appearanceScript = `(function(){try{var sk=${toScriptSafe(storageKey)},fb=${toScriptSafe(appearance)},s=localStorage.getItem(sk),appearance=(${APPEARANCE_VALID_CHECK})?s:fb,colorScheme=appearance;"automatic"===appearance&&(colorScheme=window.matchMedia(${toScriptSafe(MEDIA)}).matches?"dark":"light"),document.documentElement.classList.remove(${APPEARANCE_REMOVE_ARGS}),document.documentElement.classList.add(colorScheme),document.documentElement.style.colorScheme=colorScheme,document.documentElement.dataset.appearance=appearance}catch(e){}})()`;
  const nonceProps = nonce === undefined ? {} : { nonce };

  return <script dangerouslySetInnerHTML={{ __html: appearanceScript }} suppressHydrationWarning {...nonceProps} />;
}
