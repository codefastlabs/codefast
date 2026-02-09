import { useCallback, useMemo } from 'react';
import { useTheme } from '@codefast/theme';

export const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#0a0a0a',
};

export function useMetaColor() {
  const { theme } = useTheme();

  const metaColor = useMemo(() => {
    return theme !== 'dark' ? META_THEME_COLORS.light : META_THEME_COLORS.dark;
  }, [theme]);

  const setMetaColor = useCallback((color: string) => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, []);

  return {
    metaColor,
    setMetaColor,
  };
}
