/**
 * Generates a script that prevents theme flash by applying theme before React hydrates.
 * This script runs synchronously in the <head> before any other scripts.
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
      resolvedTheme = currentTheme === 'light' || currentTheme === 'dark' ? currentTheme : 'light';
    }

    if (resolvedTheme) {
      var root = document.documentElement;

      // Apply theme to DOM element
      if (attribute === 'class') {
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
      } else {
        root.setAttribute(attribute, resolvedTheme);
      }

      if (enableColorScheme) {
        root.style.colorScheme = resolvedTheme;
      }
    }
  } catch (e) {}
})();`;
}
