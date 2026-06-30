import type { JSX } from "react";

import { MEDIA } from "#/constants";
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
   * Initial color scheme from server (e.g., from cookie via loader).
   *
   * When `storageKey` is provided, this acts as a fallback if the storage entry is absent
   * or contains an unrecognised value.
   */
  readonly colorScheme: ColorScheme;
  /**
   * CSP nonce applied to the inline script element.
   */
  readonly nonce?: string;
  /**
   * When provided, the inline script reads `localStorage.getItem(storageKey)` before
   * first paint and uses that value if it is a recognised color scheme (`"light"`, `"dark"`,
   * or `"automatic"`). Falls back to `colorScheme` when the key is absent or invalid.
   *
   * Use this for client-only React apps that persist the color scheme in `localStorage` instead
   * of an HTTP cookie to prevent FOUC.
   *
   * @example
   * ```tsx
   * <AppearanceScript colorScheme="automatic" storageKey="my-app-color-scheme" />
   * ```
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
 * 1. Resolves 'automatic' to 'light' or 'dark' using `matchMedia()`
 * 2. Removes prior `light` / `dark` / `automatic` classes on `<html>` (SSR may
 *    have applied the wrong resolved class for `automatic`, e.g. default `dark`)
 * 3. Adds the resolved color scheme class and sets `color-scheme` for native controls
 * 4. Writes the *preference* to `data-appearance` so preference-aware UI (e.g. a 3-state toggle)
 *    can render the right state from CSS on first paint, without a hydration flash
 *
 * @example
 * ```tsx
 * // In __root.tsx (TanStack Start)
 * <head>
 *   <AppearanceScript colorScheme={colorScheme} />
 * </head>
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function AppearanceScript({ nonce, storageKey, colorScheme }: AppearanceScriptProps): JSX.Element {
  // S2: toScriptSafe = JSON.stringify + escape <>/  so </script> cannot break out of the tag.
  // F1: When storageKey is provided, the script reads localStorage before first paint so
  // client-only apps (no SSR cookie) get the right color scheme without FOUC.
  // sk=null short-circuits to s=null so color scheme falls back to fbt — backward-compatible.
  const appearanceScript = `(function(){try{var sk=${toScriptSafe(storageKey ?? null)},fbt=${toScriptSafe(colorScheme)},s=sk&&localStorage.getItem(sk),theme=(${COLOR_SCHEME_VALID_CHECK})?s:fbt,resolvedTheme=theme;"automatic"===theme&&(resolvedTheme=window.matchMedia(${toScriptSafe(MEDIA)}).matches?"dark":"light"),document.documentElement.classList.remove(${COLOR_SCHEME_REMOVE_ARGS}),document.documentElement.classList.add(resolvedTheme),document.documentElement.style.colorScheme=resolvedTheme,document.documentElement.dataset.appearance=theme}catch(e){}})()`;
  const nonceProps = nonce === undefined ? {} : { nonce };

  return <script dangerouslySetInnerHTML={{ __html: appearanceScript }} suppressHydrationWarning {...nonceProps} />;
}
