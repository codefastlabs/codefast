/**
 * Generate an inline script that prevents theme flash (FOUC) by applying the theme
 * before React hydrates on the client.
 *
 * This script runs synchronously in the <head> before any other scripts execute,
 * ensuring the correct theme is applied immediately when the page loads. It reads
 * the theme from localStorage and applies it to the document root element.
 *
 * @param storageKey - The localStorage key where the theme preference is stored. Defaults to 'theme'.
 * @param attribute - The HTML attribute to apply the theme to ('class' or 'data-theme'). Defaults to 'class'.
 * @param defaultTheme - The fallback theme if no stored preference exists. Defaults to 'system'.
 * @param enableSystem - Whether to resolve 'system' theme from OS preference. Defaults to true.
 * @param enableColorScheme - Whether to set the CSS color-scheme property. Defaults to true.
 *
 * @returns A string containing the inline JavaScript code to be injected into the <head>.
 *
 * @example
 * ```tsx
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
 * </head>
 * ```
 */
export function getThemeScript(
  storageKey: string = 'theme',
  attribute: string = 'class',
  defaultTheme: string = 'system',
  enableSystem: boolean = true,
  enableColorScheme: boolean = true,
): string {
  const storageKeyEscaped = JSON.stringify(storageKey);
  const attributeEscaped = JSON.stringify(attribute);
  const defaultThemeEscaped = JSON.stringify(defaultTheme);

  return `(function() {
  try {
    var storageKey = ${storageKeyEscaped};
    var attribute = ${attributeEscaped};
    var defaultTheme = ${defaultThemeEscaped};
    var enableSystem = ${enableSystem};
    var enableColorScheme = ${enableColorScheme};

    var theme = null;
    try {
      theme = localStorage.getItem(storageKey);
    } catch (e) {}

    // Use stored theme or fallback to default theme
    var currentTheme = theme || defaultTheme;

    // Resolve theme based on system preference or explicit value
    var resolvedTheme = null;
    if (currentTheme === 'system' && enableSystem) {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (currentTheme === 'system') {
      resolvedTheme = 'light';
    } else {
      // Use theme as-is (supports custom theme strings)
      resolvedTheme = currentTheme;
    }

    if (resolvedTheme) {
      var root = document.documentElement;

      // Apply theme to DOM element
      if (attribute === 'class') {
        root.classList.remove('light', 'dark');
        // Add theme as class (works for 'light', 'dark', and custom themes)
        root.classList.add(resolvedTheme);
      } else {
        root.setAttribute(attribute, resolvedTheme);
      }

      // Only set colorScheme for 'light' or 'dark'
      if (enableColorScheme && (resolvedTheme === 'light' || resolvedTheme === 'dark')) {
        root.style.colorScheme = resolvedTheme;
      }
    }
  } catch (e) {}
})();`;
}
