import type { Theme } from '@/integrations/theme/types';

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

type ThemeScriptProps = {
    theme: Theme;
};

/* -----------------------------------------------------------------------------
 * Component: ThemeScript
 * -------------------------------------------------------------------------- */

/**
 * Script to prevent FOUC (Flash of Unstyled Content) by setting the theme class immediately.
 * This must be placed in the <head> of the document.
 */
export function ThemeScript({ theme }: ThemeScriptProps) {
    const themeScript = `
    (function() {
      try {
        var theme = '${theme}';
        var resolvedTheme = theme;
        
        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.classList.add(resolvedTheme);
        document.documentElement.style.colorScheme = resolvedTheme;
      } catch (e) {}
    })()
  `;

    return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
