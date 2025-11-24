import { useCallback, useMemo } from 'react';
import { useTheme } from '@/integrations/theme/provider';

export const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#0a0a0a',
};

export function useMetaColor() {
  const { resolvedTheme } = useTheme();

  const metaColor = useMemo(() => {
    return resolvedTheme !== 'dark' ? META_THEME_COLORS.light : META_THEME_COLORS.dark;
  }, [resolvedTheme]);

  const setMetaColor = useCallback((color: string) => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, []);

  return {
    metaColor,
    setMetaColor,
  };
}
